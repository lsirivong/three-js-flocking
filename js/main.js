// (function () {
	var camera, scene, renderer;
	var geometry, material, leaderMaterial;

	var worldSize = {width: null, height: null};
	var gridSize = {width: null, height: null};

	var hDirection = 1; vDirection = 1;

	var stopped = false;

	var velocity;

	var material1, material2, material3, material4;

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
		 autoPlay : false
		,spriteWidth : 12
		,spriteHeight : 20
		,spriteCount : 400
		,mergeDistance : 60
		,repelDistance : 12
		,wallRepelDistance : 300
		,wallRepelScale : 0.25
		,minSpeed : 3
		,maxSpeed : 4
		,maxDeltaAngle : 3 * Math.PI / 180
		,color: 0x000000
		,leaderColor: 0xf50000
		// ,leaderColor: 0xf5ec0c // yellow
		,drawNeighborLines: false
		,gridColCount : 16
		,gridRowCount : 16
		,avoidWalls : false
		,reflectOffWalls : false
		,rangeOfVision : (Math.PI / 2) // half of range of vision
	};

	init();
	animate();

	window.setInterval(function() {
		if (!stopped && frames < 30) {
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

		material1 = new THREE.MeshBasicMaterial( { color: 0xF01EB5 } );
		material2 = new THREE.MeshBasicMaterial( { color: 0x5ED80C } );
		material3 = new THREE.MeshBasicMaterial( { color: 0x348BE9 } );
		material4 = new THREE.MeshBasicMaterial( { color: 0xF5AF1A } );


		leaderMaterial = new THREE.MeshBasicMaterial( { color: config.leaderColor } );

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

		for (var i = config.spriteCount - 1; i >= 0; i--) {
		// for (var i = 0; i < config.spriteCount; i++) {
			velocity = getInitialVelocity();
			var isFollower = i % 50 !== 0;
			mesh = new THREE.Mesh( geometry, isFollower ? material : leaderMaterial );
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
				,speed: config.maxSpeed
				,gridPos: gridPos
				,isFollower: isFollower
			});

			grid[gridPos.x][gridPos.y].push(guys[guys.length - 1]);
			mesh.rotation.z = (new THREE.Vector3(1, 0, 0)).angleTo(velocity) * (velocity.y < 0 ? -1 : 1) ;

			scene.add(mesh);
			// scene.add(neighborBlock);
		};


		// renderer = new THREE.CanvasRenderer();
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(worldSize.width, worldSize.height);

		document.body.appendChild( renderer.domElement );

		window.onkeyup = onkeyupHandler;

		if (!config.autoPlay) {
			stopped = true;
		}
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

			if (guy.isFollower) {
				var hasLeader = false;
				for (var m = -1; m <= 1; m++) {
					var colIndex = guy.gridPos.x + m;
					if (0 <= colIndex && colIndex < grid.length) {
						for (var n = -1; n <= 1; n++) {
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

									if (distanceTo < config.mergeDistance && guy.velocity.angleTo(diff.clone().negate()) < config.rangeOfVision) { // possible neighbors are within 120° in front of self
										var lm;
										hasLeader = true;

										if (distanceTo < config.repelDistance) {
											lm = lineRepelMaterial;
											guy.velocity.add(diff.normalize().multiplyScalar(0.05));
											hasObstacle = true;
										} else {
											lm = lineMaterial;
											var v = otherGuy.velocity.clone();
											if (!otherGuy.isFollower) { v.multiplyScalar(100) };
											guy.velocity.add(diff.negate().normalize().multiplyScalar(0.05)); // go to where the otherguy is
											guy.velocity.add(v.multiplyScalar(2)); // move the same way as the otherguy
											guy.velocity.normalize();
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
										
										if (guy.drawNeighborLines) {
											var lg = new THREE.Geometry();
											lg.vertices.push(mesh.position);
											lg.vertices.push(otherGuy.mesh.position);
											neighborLines.push(new THREE.Line(lg, lm));

											lgHeadMesh = new THREE.Mesh(lgHead, lineHeadMaterial);
											lgHeadMesh.position.x = otherGuy.mesh.position.x;
											lgHeadMesh.position.y = otherGuy.mesh.position.y;
											neighborLines.push(lgHeadMesh);

											otherGuy.mesh.material = material;
										}
									}
								}
							}
						}
					}
				} // end for

				// if (!hasLeader) {
				// 	// no leader, slow it down
				// 	guy.speed *= 0.5;
				// };
			} // if (isFollower)

			clampTurnRadius(guy.velocity, oldVelocity, config.maxDeltaAngle);

			if (config.avoidWalls) {
				var distanceToVWall = worldSize.width - Math.abs(guy.mesh.position.x);
				if (distanceToVWall < config.wallRepelDistance) {
					var which = guy.mesh.position.x < 0 ? 'left' : 'right';
					var yAxis = new THREE.Vector3(0, 1, 0);
					var angleTo = yAxis.angleTo(guy.velocity);
					var isMovingToward = guy.velocity.x > 0 ? (which === 'right') : (which === 'left');
					if (isMovingToward) {
						guy.speed *= 0.9;
						// console.log('approaching ' + which, THREE.Math.radToDeg(angleTo));
						if (angleTo > THREE.Math.PI / 2) {
							guy.velocity.add(new THREE.Vector3((which === 'left' ? 1 : -1), 0, 0).multiplyScalar(config.wallRepelScale));
							// guy.velocity.add(new THREE.Vector3(0, -1, 0).multiplyScalar(0.2));
						} else {
							guy.velocity.add(new THREE.Vector3((which === 'left' ? 1 : -1), 0, 0).multiplyScalar(config.wallRepelScale));
							// guy.velocity.add(new THREE.Vector3(0, 1, 0).multiplyScalar(0.2));
						}
					}
				}
				var distanceToHWall = worldSize.height - Math.abs(guy.mesh.position.y);
				if (distanceToHWall < config.wallRepelDistance) {
					var which = guy.mesh.position.y < 0 ? 'bottom' : 'top';
					var xAxis = new THREE.Vector3(1, 0, 0);
					var angleTo = xAxis.angleTo(guy.velocity);
					var isMovingToward = guy.velocity.y >= 0 ? (which === 'top') : (which === 'bottom');
					if (isMovingToward) {
						guy.speed *= 0.9;
						// console.log('approaching ' + which, THREE.Math.radToDeg(angleTo));
						if (angleTo > THREE.Math.PI / 2) {
							guy.velocity.add(new THREE.Vector3(0, (which === 'bottom' ? 1 : -1), 0).multiplyScalar(config.wallRepelScale));
							// guy.velocity.add(new THREE.Vector3(1, 1, 0).multiplyScalar(0.1));
						} else {
							guy.velocity.add(new THREE.Vector3(0, (which === 'bottom' ? 1 : -1), 0).multiplyScalar(config.wallRepelScale));
							// guy.velocity.sub(new THREE.Vector3(1, 1, 0).multiplyScalar(0.1));
						}
					}
				}
			}

			guy.velocity.normalize();

			// if (guy.isFollower) {
				guy.speed *= (hasObstacle ? 0.8 : 1.2);
				guy.speed = THREE.Math.clamp(guy.speed, config.minSpeed, config.maxSpeed);
			// };


			// keep it within the world

			if (config.reflectOffWalls) {
				var newPos = mesh.position.clone().add(guy.velocity.clone().multiplyScalar(guy.speed));

				if (newPos.x < -(worldSize.width) || worldSize.width < newPos.x) {
					guy.velocity.reflect(new THREE.Vector3(0, 1, 0));
				}

				if (newPos.y < -(worldSize.height) || worldSize.height < newPos.y) {
					guy.velocity.reflect(new THREE.Vector3(1, 0, 0));
				}

				guy.mesh.position.add(guy.velocity.clone().multiplyScalar(guy.speed));
			} else {
				var newPos = mesh.position.clone().add(guy.velocity.clone().multiplyScalar(guy.speed));

				var distanceFromWall = Math.abs(newPos.x) - worldSize.width;
				if (0 <= distanceFromWall) {
					newPos.x = THREE.Math.clamp(-(newPos.x) - (distanceFromWall * (newPos.x < 0 ? 1 : -1)), -(worldSize.width - 1), worldSize.width - 1);
				}
				var distanceFromWall = Math.abs(newPos.y) - worldSize.height;
				if (0 <= distanceFromWall) {
					newPos.y = THREE.Math.clamp(-(newPos.y) - (distanceFromWall * (newPos.y < 0 ? 1 : -1)), -(worldSize.height - 1), worldSize.height - 1);
				}

				guy.mesh.position.copy(newPos);
			}

			mesh.rotation.z = (new THREE.Vector3(1, 0, 0)).angleTo(guy.velocity)  * (guy.velocity.y < 0 ? -1 : 1);

			guy.neighborBlock.position.x = guy.mesh.position.x;
			guy.neighborBlock.position.y = guy.mesh.position.y;
		};


		for (var i = 0; i < neighborLines.length; i++) {
			scene.add(neighborLines[i]);
		};

		assignGridPos();

		renderer.render( scene, camera );
	}

	// modifies velocity
	function clampTurnRadius(velocity, originalVelocity, maxDeltaAngle) {
		if (maxDeltaAngle < velocity.angleTo(originalVelocity)) {
			var test = velocity.clone().applyAxisAngle(zAxis, originalVelocity.angleTo(new THREE.Vector3(1, 0, 0)));
			var modifier = (test.y < 0) ? -1 : 1;

			velocity.copy(originalVelocity).applyAxisAngle(zAxis, modifier * maxDeltaAngle);
		}
	}

	function assignGridPos() {
		// clear current positions

		for (var i = 0; i < grid.length; i++) {
			var col = grid[i];
			for (var j = 0; j < col.length; j++) {
				col[j] = [];
			};
		};

		for (var i = 0; i < guys.length; i++) {
			var guy = guys[i];
			var mesh = guy.mesh;
			guy.gridPos.x = Math.floor((mesh.position.x + worldSize.width) / gridSize.width);
			guy.gridPos.y = Math.floor((mesh.position.y + worldSize.height) / gridSize.height);

			grid[guy.gridPos.x][guy.gridPos.y].push(guys[i]);
		};
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