// (function () {
	var camera, scene, renderer;
	var geometry, material;

	var worldSize = {width: null, height: null};

	var hDirection = 1; vDirection = 1;

	var stopped = false;

	var velocity;

	var guys = [];

	var config = {
		 spriteWidth : 40
		,spriteHeight : 60
		,spriteCount : 100
		,maxVelocity : 4
	};

	init();
	animate();

	function init() {
		worldSize.width = window.innerWidth;
		worldSize.height = window.innerHeight;

		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 1000;

		scene = new THREE.Scene();

		// geometry = new THREE.CubeGeometry( 200, 200, 200 );
		material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

		// mesh = new THREE.Mesh( geometry, material );
		// scene.add( mesh );

		geometry = new THREE.Geometry();

		geometry.vertices.push( new THREE.Vector3( 0,  config.spriteWidth / 2, 0 ) );
		geometry.vertices.push( new THREE.Vector3( 0, -(config.spriteWidth / 2), 0 ) );
		geometry.vertices.push( new THREE.Vector3(  config.spriteHeight, 0, 0 ) );
		geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
		geometry.computeBoundingSphere();

		for (var i = 0; i < config.spriteCount; i++) {
			velocity = getInitialVelocity();
			mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = (Math.random() * worldSize.width * 2 - worldSize.width);
			mesh.position.y = (Math.random() * worldSize.height * 2 - worldSize.height);
			guys.push({
				 mesh: mesh
				,velocity: velocity.setLength(4)
			});

			scene.add(mesh);
		};


		// renderer = new THREE.CanvasRenderer();
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(worldSize.width, worldSize.height);

		document.body.appendChild( renderer.domElement );

		window.onkeyup = onkeyupHandler;
	}

	function animate() {
		// note: three.js includes requestAnimationFrame shim
		if (!stopped) {
			requestAnimationFrame( animate );
		}

		for (var i = 0; i < guys.length; i++) {
			var guy = guys[i];
			var mesh = guy.mesh;

			var l = guy.velocity.length();
			// find the nearest guy (brute force)
			for (var j = 0; j < guys.length; j++) {
				if (j === i) {
					// don't compare to self
					continue;
				}
				var distanceTo = guy.mesh.position.distanceTo(guys[j].mesh.position);
				if (distanceTo < 140) {
					if (distanceTo < 80) {
						// TODO: if too close, move apart (subtract positions)
						// add the two guys' velocity
						// var 
						// guy.velocity.add()
						var diff = mesh.position.clone();
						diff.sub(guys[j].mesh.position);
						guy.velocity.add(diff);
					} else {
						// add something so that they don't change their velocity too much
						guy.velocity.add(guys[j].velocity);
					}
				}
			}

			guy.velocity.setLength(l);
			mesh.position.add(guy.velocity);

			// keep it within the world
			mesh.position.x = mesh.position.x < -(worldSize.width) ? worldSize.width : mesh.position.x;
			mesh.position.x = worldSize.width < mesh.position.x ? -(worldSize.width) : mesh.position.x;
			mesh.position.y = mesh.position.y < -(worldSize.height) ? worldSize.height : mesh.position.y;
			mesh.position.y = worldSize.height < mesh.position.y ? -(worldSize.height) : mesh.position.y;
		};

		renderer.render( scene, camera );
	}

	// returns THREE.Vector3;
	function getInitialVelocity() {
		return new THREE.Vector3(config.maxVelocity * 2 * Math.random() - config.maxVelocity, config.maxVelocity * 2 * Math.random() - config.maxVelocity, 0);
	}

	// play/pause
	function onkeyupHandler (e) {
		if (32 === e.which) { // space
			stopped = !stopped;
			if (!stopped) {
				animate();
			}
		}
	};
// })();