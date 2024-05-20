import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gltfurl from'/assets/admd.glb?url';
import background from'/assets/sea.jpg?url';
import introduction from'/assets/i1.png?url';
import waternormals from'/assets/waternormals.jpg?url';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/Addons.js';

	var planeMeshLayer = new THREE.Layers();
	planeMeshLayer.enable(1);
	planeMeshLayer.disable(0);

	//scene
	const scene = new THREE.Scene();
	/*const texture = new THREE.TextureLoader().load(background ); 
	scene.background = texture;*/

	// Light
	const ambientLight = new THREE.AmbientLight(0xcccccc,3);
	scene.add(ambientLight);

	const pointLight2 = new THREE.PointLight( 0xcccccc, 8, 120 ,0.4);
	pointLight2.position.set(0,30,-35)
	pointLight2.castShadow= true;
	scene.add(pointLight2);

	const pointLight3 = new THREE.PointLight( 0xcccccc, 8, 60 ,0.2);
	pointLight3.position.set(-120,30,0)
	pointLight3.castShadow= true;
	scene.add(pointLight3);

	//axes
	/*var axes = new THREE.AxesHelper(40,20);
	scene.add(axes);*/

	//canvas render
	const canvas = document.querySelector('canvas.webgl')
	const renderer = new THREE.WebGLRenderer({
		alpha:true,
		antialias:true,
		canvas:canvas
		});
	renderer.shadowMap.enable = true;
	renderer.setSize(window.innerWidth,window.innerHeight)

	//loader
	const gltfLoader = new GLTFLoader();

	//raycast
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	
	//camera
	const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight,1, 10000 );
	camera.position.set(0,80,0);
	camera.layers.enable(1);
	camera.layers.enable(2);
	scene.add(camera);
	//controller
	var controls = new OrbitControls( camera, renderer.domElement );
	controls.minPolarAngle = Math.PI / 4;
	controls.maxPolarAngle = Math.PI/2.2;
	controls.enableDamping = true;
	controls.enabled = true;

//animator renderer
function animator(){
	const time = performance.now() * 0.001;
	controls.update();
	hitpoint1();
	water.material.uniforms[ 'time' ].value += 0.4 / 60.0;
	requestAnimationFrame( animator );
	renderer.render( scene, camera );
}

//创建海洋
let water;
const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

water = new Water(
	waterGeometry,
	{
		textureWidth: 474,
		textureHeight: 474,
		waterNormals: new THREE.TextureLoader().load( waternormals, function ( texture ) {
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

		} ),
		waterColor: 0x001e0f,
		distortionScale: 3.7,
		fog: scene.fog !== undefined
	}
);

water.rotation.x = - Math.PI / 2;

scene.add( water );
water.traverse((obj) => {
	if (obj.castShadow !== undefined) {
		// 开启投射影响
		obj.castShadow = true;
		// 开启被投射阴影
		obj.receiveShadow = true;
	}
})

// Skybox
let sun;
sun = new THREE.Vector3();


const sky = new Sky();
sky.scale.setScalar( 10000);
scene.add( sky );

const skyUniforms = sky.material.uniforms;

skyUniforms[ 'turbidity' ].value = 10;
skyUniforms[ 'rayleigh' ].value = 2;
skyUniforms[ 'mieCoefficient' ].value = 0.005;
skyUniforms[ 'mieDirectionalG' ].value = 0.8;

const parameters = {
	elevation: 2,
	azimuth: 180
};

const pmremGenerator = new THREE.PMREMGenerator( renderer );
const sceneEnv = new THREE.Scene();

let renderTarget;

function updateSun() {

	const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
	const theta = THREE.MathUtils.degToRad( parameters.azimuth );

	sun.setFromSphericalCoords( 1, phi, theta );

	sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
	water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

	if ( renderTarget !== undefined ) renderTarget.dispose();

	sceneEnv.add( sky );
	renderTarget = pmremGenerator.fromScene( sceneEnv );
	scene.add( sky );

	scene.environment = renderTarget.texture;

	}

updateSun();

//模型导入
let boat;
gltfLoader.load(gltfurl,function(gltf){
	boat = gltf.scene
	scene.add(boat);
	boat.traverse((obj) => {
		if (obj.castShadow !== undefined) {
		    // 开启投射影响
			obj.castShadow = true;
			// 开启被投射阴影
			obj.receiveShadow = true;
		}
	})
})

//交互1
var introductionplane = document.createElement('img');
introductionplane.src = introduction; // 替换为你的图片路径
introductionplane.style.position = 'absolute';
introductionplane.style.top = '50%';
introductionplane.style.left = '50%';
introductionplane.style.transform = 'translate(-50%, -50%)';
introductionplane.style.display = 'none'; // 初始时隐藏图片
document.body.appendChild(introductionplane);

//交互点1
function hitpoint1(){
var material = new THREE.MeshBasicMaterial()
var markGeometry = new THREE.SphereGeometry(0.2)
var mark = new THREE.Mesh(markGeometry,material)
mark.layers.enable(1);
mark.layers.disable(0);
function point1(){
	if (boat){
	mark.position.set((camera.position.x+boat.position.x)*0.9,(camera.position.y+boat.position.y)*0.9,(camera.position.z+boat.position.z)*0.9); 
	scene.add(mark); 
	}
}
}
hitpoint1();

//选取交互
function select(){
	raycaster.setFromCamera(mouse,camera);
	raycaster.layers = planeMeshLayer;
	renderer.domElement,addEventListener('click',e=>{
		e.preventDefault(); // 阻止默认行为
    	e.stopPropagation(); // 阻止事件冒泡
        //鼠标位置标准化为设备位置
        mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
        //更新射线
        raycaster.setFromCamera(mouse,camera);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length != 0 ) {
			// 获取第一个相交的物体
			const intersectedObject = intersects[0].object;
			// 显示介绍
			if (intersectedObject.layers.test(planeMeshLayer)) {
				introductionplane.style.display = 'block'; // 显示图片 
				scene.remove(mark);
				controls.enabled = false;
			}
		}
		else 
		introductionplane.style.display = 'none';
		scene.add(mark);
		controls.enabled = true;
	})

	renderer.domElement,addEventListener('touchstart',e=>{
		e.preventDefault(); // 阻止默认行为
    	e.stopPropagation(); // 阻止事件冒泡
        //鼠标位置标准化为设备位置
        mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
        //更新射线
        raycaster.setFromCamera(mouse,camera);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length != 0 ) {
			// 获取第一个相交的物体
			const intersectedObject = intersects[0].object;
			// 显示介绍
			if (intersectedObject.layers.test(planeMeshLayer)) {
				introductionplane.style.display = 'block'; // 显示图片 
				scene.remove(mark);
				controls.enabled = false;
			}
		}
		else 
		introductionplane.style.display = 'none';
		scene.add(mark);
		controls.enabled = true;
	})
}

// 监听画面变化，更新渲染画面
window.addEventListener('resize',()=>{
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
  })
select();
animator();