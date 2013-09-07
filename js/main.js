// (function () {
	var camera, scene, renderer;
	var geometry, material;

	var worldSize = {width: null, height: null};

	var hDirection = 1; vDirection = 1;

	var stopped = false;

	var velocity;

	var guys = [];

	var guyCount = 10;

	init();
	animate();

	function init() {
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 1000;

		scene = new THREE.Scene();

		// geometry = new THREE.CubeGeometry( 200, 200, 200 );
		material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

		// mesh = new THREE.Mesh( geometry, material );
		// scene.add( mesh );

		geometry = new THREE.Geometry();

		geometry.vertices.push( new THREE.Vector3( 0,  20, 0 ) );
		geometry.vertices.push( new THREE.Vector3( 0, -20, 0 ) );
		geometry.vertices.push( new THREE.Vector3(  60, 0, 0 ) );
		geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
		geometry.computeBoundingSphere();


		for (var i = 0; i < guyCount; i++) {
			velocity = new THREE.Vector3(6 * Math.random() - 3, 6 * Math.random() - 3, 0);
			mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = (Math.random() * worldSize.width * 2 - worldSize.width);
			mesh.position.y = (Math.random() * worldSize.height * 2 - worldSize.height);
			guys.push({
				 mesh: mesh
				,velocity: velocity
			});

			scene.add(mesh);
		};


		// renderer = new THREE.CanvasRenderer();
		renderer = new THREE.WebGLRenderer();
		worldSize.width = window.innerWidth;
		worldSize.height = window.innerHeight;
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
			var velocity = guy.velocity;
			mesh.position.add(velocity);

			// keep it within the world
			mesh.position.x = mesh.position.x < -(worldSize.width) ? worldSize.width : mesh.position.x;
			mesh.position.x = worldSize.width < mesh.position.x ? -(worldSize.width) : mesh.position.x;
			mesh.position.y = mesh.position.y < -(worldSize.height) ? worldSize.height : mesh.position.y;
			mesh.position.y = worldSize.height < mesh.position.y ? -(worldSize.height) : mesh.position.y;
		};

		renderer.render( scene, camera );
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