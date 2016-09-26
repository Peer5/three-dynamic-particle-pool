'use strict';

var expect = require('chai').expect;
var DynamicParticlePool = require('./dynamic-particle-pool');


describe('Dynamic Particle Pool', function suit() {
  var object3d;
  beforeEach(function() {
    var items = [];
    object3d = {
      items: items,
      add: function(item) {
        items.push(item);
      },
      remove: function (item) {
        var index = items.indexOf(item);
        if (index !== -1) {
          items.splice(index, 1);
        }
      }
    };
  });

  it('Attach mesh to the 3d object', function test() {
    var particlePool = new DynamicParticlePool(object3d, {
      maximumParticles: 30,
      minimumParticles: 30,
      particlesPerGeometry: 30,
      cleanupInterval: Infinity
    });

    expect(object3d.items.length).to.equal(1);
    expect(object3d.items[0]).to.be.an('object');
    expect(particlePool.pools[0].mesh).to.equal(object3d.items[0]);
  });

  it('creates enough pools to occupy the minimum', function test() {
    var particlePool = new DynamicParticlePool(object3d, {
      maximumParticles: 30,
      minimumParticles: 10,
      particlesPerGeometry: 5,
      cleanupInterval: Infinity
    });

    expect(particlePool.pools.length).to.equal(2);
    expect(particlePool.pools[0].size).to.equal(5);
    expect(particlePool.pools[0].available.length).to.equal(5);
    expect(particlePool.pools[1].size).to.equal(5);
    expect(particlePool.pools[1].available.length).to.equal(5);

    var particlePool2 = new DynamicParticlePool(object3d, {
      minimumParticles: 0
    });
    expect(particlePool2.pools.length).to.equal(0);
  });

  it('dynamically creates more pools if requested', function test() {
    var particlePool = new DynamicParticlePool(object3d, {
      maximumParticles: 20,
      minimumParticles: 10,
      particlesPerGeometry: 5,
      cleanupInterval: Infinity
    });

    var seen = [];

    var i = 20;
    while (i--) {
      var particle = particlePool.getParticle();
      expect(particle).to.be.an('object');
      expect(seen.indexOf(particle) === -1);
      seen.push(particle);
    }

    expect(particlePool.pools.length).to.equal(4);
    expect(particlePool.pools[0].available.length).to.equal(0);
    expect(particlePool.pools[1].available.length).to.equal(0);
    expect(particlePool.pools[2].available.length).to.equal(0);
    expect(particlePool.pools[3].available.length).to.equal(0);
  });

  it('limits the amount of particles', function test() {
    var particlePool = new DynamicParticlePool(object3d, {
      maximumParticles: 20,
      minimumParticles: 10,
      particlesPerGeometry: 5,
      cleanupInterval: Infinity
    });

    var i = 20;
    while (i--) {
      particlePool.getParticle();
    }

    expect(particlePool.getParticle()).to.equal(null);

    expect(particlePool.pools.length).to.equal(4);
    expect(particlePool.pools[0].available.length).to.equal(0);
    expect(particlePool.pools[1].available.length).to.equal(0);
    expect(particlePool.pools[2].available.length).to.equal(0);
    expect(particlePool.pools[3].available.length).to.equal(0);
  });

  it('reuses particles that were freed', function test() {
    var particlePool = new DynamicParticlePool(object3d, {
      maximumParticles: 10,
      minimumParticles: 0,
      particlesPerGeometry: 5,
      cleanupInterval: Infinity
    });

    var seen = [];
    var i = 10;
    while (i--) {
      seen.push(particlePool.getParticle());
    }

    expect(particlePool.getParticle()).to.equal(null);


    seen[seen.length - 1].free();

    var particle = particlePool.getParticle();
    expect(particle).to.be.an('object');
    expect(seen.indexOf(particle)).to.not.equal(-1);
  });

  it('prefers particles from lowest pool', function test() {
    var particlePool = new DynamicParticlePool(object3d, {
      maximumParticles: 10,
      minimumParticles: 0,
      particlesPerGeometry: 5,
      cleanupInterval: Infinity
    });

    var seen = [];
    var i = 5;
    while (i--) {
      seen.push(particlePool.getParticle());
    }

    expect(particlePool.pools.length).to.equal(1);
    particlePool.getParticle();
    expect(particlePool.pools.length).to.equal(2);
    expect(particlePool.pools[0].available.length).to.equal(0);
    expect(particlePool.pools[1].available.length).to.equal(4);

    seen[0].free();
    expect(particlePool.pools[0].available.length).to.equal(1);
    expect(particlePool.pools[1].available.length).to.equal(4);

    var particle = particlePool.getParticle();
    expect(particle).to.be.an('object');
    expect(seen.indexOf(particle)).to.not.equal(-1);
    expect(particlePool.pools[0].available.length).to.equal(0);
    expect(particlePool.pools[1].available.length).to.equal(4);
  });

  it('cleanup unused pools', function test(done) {
    var particlePool = new DynamicParticlePool(object3d, {
      maximumParticles: 50,
      minimumParticles: 10,
      particlesPerGeometry: 10,
      cleanupInterval: 10
    });

    var seen = [];
    var i = 50;
    while (i--) {
      seen.push(particlePool.getParticle());
    }

    seen.forEach(function(particle) {
      particle.free();
    });

    expect(particlePool.pools.length).to.equal(5);

    setTimeout(function() {
      particlePool.update();
      expect(particlePool.pools.length).to.equal(1);
      expect(object3d.items.length).to.equal(1);
      done();
    }, 11);
  });
});
