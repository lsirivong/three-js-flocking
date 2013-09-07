(function () {
	var camera, scene, renderer;
	var geometry, material, mesh;

	var worldSize = {width: null, height: null};

	var hDirection = 1; vDirection = 1;

	var stopped = false;

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

		geometry.vertices.push( new THREE.Vector3( 0,  100, 0 ) );
		geometry.vertices.push( new THREE.Vector3( 0, -100, 0 ) );
		geometry.vertices.push( new THREE.Vector3(  270, 0, 0 ) );
		geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
		geometry.computeBoundingSphere();

		mesh = new THREE.Mesh( geometry, material );

		scene.add(mesh);

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

		var r = Math.random();
		hDirection = Math.random() < 0.05 ? (r < 0.33 ? -1 : (r < 0.66 ? 1 : 0)) : hDirection;

		mesh.position.x += 10 * hDirection;
		mesh.position.x = mesh.position.x < -(worldSize.width) ? worldSize.width : mesh.position.x;
		mesh.position.x = worldSize.width < mesh.position.x ? -(worldSize.width) : mesh.position.x;

		r = Math.random();
		vDirection = Math.random() < 0.05 ? (r < 0.33 ? -1 : (r < 0.66 ? 1 : 0)) : vDirection;
		mesh.position.y += 10 * vDirection;
		mesh.position.y = mesh.position.y < -(worldSize.height) ? worldSize.height : mesh.position.y;
		mesh.position.y = worldSize.height < mesh.position.y ? -(worldSize.height) : mesh.position.y;

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
})();