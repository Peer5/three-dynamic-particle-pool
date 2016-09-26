# DynamicParticlePool


This is an implementation of dynamic particles pool for [three.js](https://threejs.org/) that are dynamically created and destroyed on demmand.
Since geometries in three are static and pre-allocated the approach to achieve such dynamical pool
is creating multiple pre-allocated geometries that together create a bigger pool that is managed by this module.


## Usage
```js
require('./dynamic-particle-pool'); // the module will self attach to THREE


var object3d = new THREE.Object3D();
var particlePool = THREE.DynamicParticlePool(object3d, {
  materialOptions: {
    color: 'blue'
  }
});

var particle = particlePool.getParticle();

particle.set(1, 2, 3); // manipulate x y z

// return particle to the pool to be reused
particle.free();
```

## Options

```js
/**
 * Dynamic particle pool for three.js
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
```

## Advanced Usage

```js
require('./dynamic-particle-pool'); // the module will self attach to THREE


var object3d = new THREE.Object3D();
var particlePool = THREE.DynamicParticlePool(object3d, {
  maximumParticles: 50000,
  minimumParticles: 10000,
  particlesPerGeometry: 5000,
  cleanupInterval: 20000,
  materialOptions: {
    color: 'blue'
  },
  geometryOptions: {}
});
```
