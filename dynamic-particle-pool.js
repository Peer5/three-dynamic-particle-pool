'use strict';

var THREE = typeof require === 'function' && require('three') || window.THREE;

/**
 * Dynamic particle pool for three.js
 * @version v0.0.1
 * @link https://github.com/Peer5/dynamic-particle-pool/
 *
 * @param {object} object3d - object3d to attach the mesh to
 * @param {object} [options]
 * @param {number} [options.maximumParticles] - maximum particles to allow for this pool
 * @param {number} [options.minimumParticles] - minimum particles count to pre-allocate
 * @param {number} [options.particlesPerGeometry] - amount of particles to create per geometries
 * @param {number} [options.cleanupInterval] - ms. clean stale particles every this interval
 * @param {number} [options.materialOptions] - pass options to the points material
 * @param {number} [options.geometryOptions] - pass options to the geometry
 * @param {number} [options.offScreenPosition] - off screen position for freed particles
 * @param {number} [options.defaultAdjustmentRatio] - default adjustment
 *
 * @method update() - update method to call on every frame
 * @method getParticle() - get particle from the pool or get null if there aren't any
 * @method increasePool(ratio, absoluteCount) - increase max particles limit by ratio or absolute number
 * @method decreasePool(ratio, absoluteCount) - decrease max particles limit by ratio or absolute number
 * @method getStats() - get cumulative stats for all pools
 *
 * @constructor
 */
THREE.DynamicParticlePool = function DynamicParticlePool(object3d, options) {
  var opts = options || {};
  opts.maximumParticles = opts.maximumParticles || 100000;
  opts.minimumParticles = typeof opts.minimumParticles === 'number' ? opts.minimumParticles : 3000;
  opts.particlesPerGeometry = opts.particlesPerGeometry || 1500;
  opts.cleanupInterval = opts.cleanupInterval || 30000;
  opts.defaultAdjustmentRatio = opts.defaultAdjustmentRatio || 1.1;
  opts.materialOptions = opts.materialOptions || {};
  opts.geometryOptions = opts.geometryOptions || {};
  var offPos = opts.offScreenPosition = opts.offScreenPosition || [9999999, 9999999, 9999999];

  var materialOptions = {
    size: 1,
    color: 'white',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    transparent: true,
    sizeAttenuation: false
  };

  Object.keys(opts.materialOptions).forEach(function forEach(key) {
    materialOptions[key] = opts.materialOptions[key];
  });

  var pools = [];
  var lastCleanup = Date.now();

  function createGeometry() {
    var geometry = new THREE.Geometry(opts.geometryOptions);
    var vertices = geometry.vertices;
    var i = opts.particlesPerGeometry;
    var available = [];

    function freePoolParticle() {
      if (!this || typeof this.free !== 'function') {
        throw new Error("particle ref doesn't work. free must be called with the original context");
      }
      this.set(offPos[0], offPos[1], offPos[2]); // move point off the screen
      available.push(this);
    }

    while (i--) {
      var particle = new THREE.Vector3(offPos[0], offPos[1], offPos[2]);
      particle.free = freePoolParticle;
      vertices.push(particle);
      available.push(particle);
    }

    var material = new THREE.PointsMaterial(materialOptions);

    var mesh = new THREE.Points(geometry, material);
    mesh.frustumCulled = false;

    object3d.add(mesh);

    pools.push({
      geometry: geometry,
      material: material,
      mesh: mesh,
      available: available,
      size: available.length
    });
  }

  function getOrCreateParticle() {
    var count = 0;
    var particle;
    pools.some(function some(pool) {
      if (pool.available.length) {
        particle = pool.available.shift();
        return true;
      }

      count += pool.size;
      return count > opts.maximumParticles;
    });

    if (!particle && count < opts.maximumParticles) {
      createGeometry();
      return getOrCreateParticle();
    }

    return particle || null;
  }


  function cleanUp() {
    var firstIdlePoolIndex = 0;
    pools.forEach(function some(pool, index) {
      if (pool.available.length !== pool.size) {
        firstIdlePoolIndex = index + 1;
      }
    });

    var idlePools = pools.length - firstIdlePoolIndex;
    if (idlePools > 1) {
      var removedPools = pools.splice(firstIdlePoolIndex + 1, idlePools - 1);
      removedPools.forEach(function forEach(p) {
        var pool = p;
        object3d.remove(pool.mesh);
        pool.material.dispose();
        pool.geometry.dispose();
        pool.available.length = 0;
        pool.available = null;
      });
    }
  }

  function getParticle() {
    return getOrCreateParticle();
  }

  function increasePool(ratio, absoluteCount) {
    if (absoluteCount) {
      opts.maximumParticles = absoluteCount;
    }
    else {
      ratio = ratio || opts.defaultAdjustmentRatio;
      var maxValue = (pools.length + 1) * opts.particlesPerGeometry;
      opts.maximumParticles = Math.min(opts.maximumParticles * ratio, maxValue);
    }
  }

  function decreasePool(ratio, absoluteCount) {
    if (absoluteCount) {
      opts.maximumParticles = absoluteCount;
    }
    else {
      ratio = ratio || opts.defaultAdjustmentRatio;
      opts.maximumParticles = Math.max(
        opts.maximumParticles / ratio,
        opts.particlesPerGeometry,
        opts.minimumParticles
      );
    }
  }

  function update() {
    pools.forEach(function forEach(pool) {
      pool.geometry.verticesNeedUpdate = true; // eslint-disable-line no-param-reassign
    });

    // check if its time to cleanup
    if (Date.now() - lastCleanup > opts.cleanupInterval) {
      cleanUp();
      lastCleanup = Date.now();
    }
  }

  function getStats() {
    var stats = {
      poolsCount: pools.length,
      particlesPerPool: opts.particlesPerGeometry,
      total: 0,
      available: 0,
      pools: []
    };
    pools.forEach(function forEach(pool) {
      stats.total += pool.size;
      stats.available += pool.available.length;
      stats.pools.push({
        size: pool.size,
        available: pool.available.length
      });
    });

    stats.used = stats.total - stats.available;
    return stats;
  }

  // initiate
  var i = Math.ceil(opts.minimumParticles / opts.particlesPerGeometry) || 0;
  while (i--) {
    createGeometry();
  }

  return {
    pools: pools,
    update: update,
    getParticle: getParticle,
    increasePool: increasePool,
    decreasePool: decreasePool,
    getStats: getStats
  };
};

if (typeof module !== 'undefined') {
  module.exports = THREE.DynamicParticlePool;
}
else {
  window.DynamicParticlePool = THREE.DynamicParticlePool;
}
