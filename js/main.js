// (function () {
	var camera, scene, renderer;
	var geometry, material;

	var worldSize = {width: null, height: null};

	var hDirection = 1; vDirection = 1;

	var stopped = false;

	var velocity;

	var guys = [];
	var neighborLines = [];

	var zAxis = new THREE.Vector3(0, 0, 1);

	var lineMaterial;
	var lineRepelMaterial;
	var lgHead;
	var lineHeadMaterial;

	var config = {
		 spriteWidth : 40
		,spriteHeight : 60
		,spriteCount : 50
		,mergeDistance : 120
		,repelDistance : 60
		,maxSpeed : 8
		,maxDeltaAngle : 2 * Math.PI / 180
		,color: 0x000000
		,drawNeighborLines: false
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
		material = new THREE.MeshBasicMaterial( { color: config.color } );

		// mesh = new THREE.Mesh( geometry, material );
		// scene.add( mesh );

		geometry = new THREE.Geometry();

		geometry.vertices.push( new THREE.Vector3( -(config.spriteHeight / 2),  config.spriteWidth / 2, 0 ) );
		geometry.vertices.push( new THREE.Vector3( -(config.spriteHeight / 2), -(config.spriteWidth / 2), 0 ) );
		geometry.vertices.push( new THREE.Vector3(  (config.spriteHeight / 2), 0, 0 ) );
		geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
		geometry.computeBoundingSphere();

		lgHead = new THREE.Geometry();
		lgHead.vertices.push(new THREE.Vector3(0, 0, 0));
		lgHead.vertices.push(new THREE.Vector3(5, 0, 0));
		lgHead.vertices.push(new THREE.Vector3(5, 5, 0));
		lgHead.vertices.push(new THREE.Vector3(0, 5, 0));
		lgHead.faces.push( new THREE.Face3( 0, 1, 2) );
		lgHead.faces.push( new THREE.Face3( 2, 3, 0) );
		lineHeadMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});

		lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00});
		lineRepelMaterial = new THREE.LineBasicMaterial({color: 0xff0000});

		for (var i = 0; i < config.spriteCount; i++) {
			velocity = getInitialVelocity();
			mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = (Math.random() * worldSize.width * 2 - worldSize.width);
			mesh.position.y = (Math.random() * worldSize.height * 2 - worldSize.height);

			var neighborBlockGeometry = new THREE.SphereGeometry(config.mergeDistance);
			neighborBlock = new THREE.Mesh( neighborBlockGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true}) );
			neighborBlock.position.x = mesh.position.x;
			neighborBlock.position.y = mesh.position.y;
			guys.push({
				 mesh: mesh
				,neighborBlock: neighborBlock
				,velocity: velocity.normalize()
				,speed: 8
			});
			mesh.rotation.z = (new THREE.Vector3(1, 0, 0)).angleTo(velocity) * (velocity.y < 0 ? -1 : 1) ;

			scene.add(mesh);
			// scene.add(neighborBlock);
		};


		renderer = new THREE.CanvasRenderer();
		// renderer = new THREE.WebGLRenderer();
		renderer.setSize(worldSize.width, worldSize.height);

		document.body.appendChild( renderer.domElement );

		window.onkeyup = onkeyupHandler;
	}

	function animate() {
		if (!stopped) {
			// note: three.js includes requestAnimationFrame shim
			requestAnimationFrame( animate );
		}

		for (var i = 0; i < neighborLines.length; i++) {
			scene.remove(neighborLines[i]);
		};
		neighborLines = [];

		for (var i = 0; i < guys.length; i++) {
			var guy = guys[i];
			var mesh = guy.mesh;

			var oldVelocity = guy.velocity.clone();


			var hasObstacle = false;
			for (var j = 0; j < guys.length; j++) {
				if (j === i) {
					// don't compare to self
					continue;
				}
				var otherGuy = guys[j];
				var distanceTo = guy.mesh.position.distanceTo(otherGuy.mesh.position);
				var diff = new THREE.Vector3().subVectors(mesh.position, otherGuy.mesh.position);

				if (distanceTo < config.mergeDistance && guy.velocity.angleTo(diff.clone().negate()) < (Math.PI / 3)) { // possible neighbors are within 120° in front of self
					var lm;

					if (distanceTo < config.repelDistance) {
						lm = lineRepelMaterial;
						guy.velocity.add(diff);
						hasObstacle = true;
					} else {
						lm = lineMaterial;
						// guy.velocity.add(diff.negate()); // go to where the otherguy is
						guy.velocity.add(otherGuy.velocity); // move the same way as the otherguy
					}

					if (config.drawNeighborLines) {
						var lg = new THREE.Geometry();
						lg.vertices.push(mesh.position);
						lg.vertices.push(otherGuy.mesh.position);
						neighborLines.push(new THREE.Line(lg, lm));

						lgHeadMesh = new THREE.Mesh(lgHead, lineHeadMaterial);
						lgHeadMesh.position.x = otherGuy.mesh.position.x;
						lgHeadMesh.position.y = otherGuy.mesh.position.y;
						neighborLines.push(lgHeadMesh);
					};
				}
			}

			if (guy.velocity.angleTo(oldVelocity) > config.maxDeltaAngle) {
				var test = guy.velocity.clone().applyAxisAngle(zAxis, oldVelocity.angleTo(new THREE.Vector3(1, 0, 0)));
				var modifier = (test.y < 0) ? -1 : 1;

				oldVelocity.applyAxisAngle(zAxis, modifier * config.maxDeltaAngle);
				guy.velocity.copy(oldVelocity);
			}

			guy.velocity.normalize();

			guy.speed *= (hasObstacle ? 0.8 : 1.2);
			guy.speed = THREE.Math.clamp(guy.speed, 2, config.maxSpeed);
			var newPos = mesh.position.clone().add(guy.velocity.clone().multiplyScalar(guy.speed));

			mesh.rotation.z = (new THREE.Vector3(1, 0, 0)).angleTo(guy.velocity)  * (guy.velocity.y < 0 ? -1 : 1);

			// keep it within the world

			if (newPos.x < -(worldSize.width) || worldSize.width < newPos.x) {
				guy.velocity.reflect(new THREE.Vector3(0, 1, 0));
			}

			if (newPos.y < -(worldSize.height) || worldSize.height < newPos.y) {
				guy.velocity.reflect(new THREE.Vector3(1, 0, 0));
			}

			guy.mesh.position.add(guy.velocity.clone().multiplyScalar(guy.speed));
			guy.neighborBlock.position.x = guy.mesh.position.x;
			guy.neighborBlock.position.y = guy.mesh.position.y;
			// mesh.position.x = mesh.position.x < -(worldSize.width) ? worldSize.width : mesh.position.x;
			// mesh.position.x = worldSize.width < mesh.position.x ? -(worldSize.width) : mesh.position.x;
			// mesh.position.y = mesh.position.y < -(worldSize.height) ? worldSize.height : mesh.position.y;
			// mesh.position.y = worldSize.height < mesh.position.y ? -(worldSize.height) : mesh.position.y;
		};


		for (var i = 0; i < neighborLines.length; i++) {
			scene.add(neighborLines[i]);
		};

		renderer.render( scene, camera );
	}

	// returns THREE.Vector3;
	function getInitialVelocity() {
		return new THREE.Vector3(2 * Math.random() - 1, 2 * Math.random() - 1, 0);
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