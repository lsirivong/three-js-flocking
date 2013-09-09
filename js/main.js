// (function () {
	var camera, scene, renderer;
	var geometry, material;

	var worldSize = {width: null, height: null};
	var gridSize = {width: null, height: null};

	var hDirection = 1; vDirection = 1;

	var stopped = false;

	var velocity;

	var guys = [];
	var neighborLines = [];
	var grid;

	var zAxis = new THREE.Vector3(0, 0, 1);

	var lineMaterial;
	var lineRepelMaterial;
	var lgHead;
	var lineHeadMaterial;

	var frames = 0;

	var config = {
		 spriteWidth : 10
		,spriteHeight : 15
		,spriteCount : 300
		,mergeDistance : 60
		,repelDistance : 30
		,minSpeed : 3
		,maxSpeed : 12
		,maxDeltaAngle : 12 * Math.PI / 180
		,color: 0x000000
		,drawNeighborLines: false
		,gridColCount : 8
		,gridRowCount : 8
	};

	init();
	animate();

	window.setInterval(function() {
		if (frames < 30) {
			console.log('framerate below 30', frames);
		};
		frames = 0;
	}, 1000);

	function init() {
		worldSize.width = window.innerWidth;
		worldSize.height = window.innerHeight;

		gridSize.width = 2 * worldSize.width / config.gridColCount;
		gridSize.height = 2 * worldSize.height / config.gridRowCount;

		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 1000;

		scene = new THREE.Scene();

		material = new THREE.MeshBasicMaterial( { color: config.color } );

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

		grid = [];
		for (var i = 0; i < config.gridColCount; i++) {
			var column = [];
			for (var j = 0; j < config.gridRowCount; j++) {
				column.push([]);
			}
			grid.push(column);
		};

		for (var i = 0; i < config.spriteCount; i++) {
			velocity = getInitialVelocity();
			mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = (Math.random() * worldSize.width * 2 - worldSize.width);
			mesh.position.y = (Math.random() * worldSize.height * 2 - worldSize.height);

			var gridPos = {};
			gridPos.x = Math.floor((mesh.position.x + worldSize.width) / gridSize.width);
			gridPos.y = Math.floor((mesh.position.y + worldSize.height) / gridSize.height);

			var neighborBlockGeometry = new THREE.SphereGeometry(config.mergeDistance);
			neighborBlock = new THREE.Mesh( neighborBlockGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true}) );
			neighborBlock.position.x = mesh.position.x;
			neighborBlock.position.y = mesh.position.y;
			guys.push({
				 id: guys.length
				,mesh: mesh
				,neighborBlock: neighborBlock
				,velocity: velocity.normalize()
				,speed: 8
				,gridPos: gridPos
			});
			grid[gridPos.x][gridPos.y].push(guys[guys.length - 1]);
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
		frames++;

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

			for (var m = -1; m < 1; m++) {
				var colIndex = guy.gridPos.x + m;
				if (0 <= colIndex && colIndex < grid.length) {
					for (var n = -1; n < 1; n++) {
						var rowIndex = guy.gridPos.y + n;
						if (0 <= rowIndex && rowIndex < grid[colIndex].length) {
							var otherGuys = grid[colIndex][rowIndex];

							for (var j = 0; j < otherGuys.length; j++) {
								var otherGuy = otherGuys[j];
								if (guy.id === otherGuy.id) {
									// don't compare to self
									continue;
								}

								var distanceTo = guy.mesh.position.distanceTo(otherGuy.mesh.position);
								var diff = new THREE.Vector3().subVectors(mesh.position, otherGuy.mesh.position);

								if (distanceTo < config.mergeDistance && guy.velocity.angleTo(diff.clone().negate()) < (Math.PI / 3)) { // possible neighbors are within 120° in front of self
									var lm;

									if (distanceTo < config.repelDistance) {
										lm = lineRepelMaterial;
										// guy.velocity.add(diff);
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

						}
					}
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
			guy.speed = THREE.Math.clamp(guy.speed, config.minSpeed, config.maxSpeed);
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

			// update grid position (if necessary)
			var oldGridPos = {x: guy.gridPos.x, y: guy.gridPos.y};
			guy.gridPos.x = Math.floor((guy.mesh.position.x + worldSize.width) / gridSize.width);
			guy.gridPos.y = Math.floor((guy.mesh.position.y + worldSize.height) / gridSize.height);

			if (oldGridPos.x != guy.gridPos.x || oldGridPos.y != guy.gridPos.y) {
				// find it
				var gridCell = grid[oldGridPos.x][oldGridPos.y];
				var indexOf = -1;
				for (var k = 0; k < gridCell.length; k++) {
					if (gridCell[k].id === guy.id) {
						indexOf = k;
					}
				};

				// remove old ref
				if (0 <= indexOf) {
					gridCell.splice(indexOf, 1);
				}

				// add to new spot
				grid[guy.gridPos.x][guy.gridPos.y].push(guy);
			};

			guy.neighborBlock.position.x = guy.mesh.position.x;
			guy.neighborBlock.position.y = guy.mesh.position.y;
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