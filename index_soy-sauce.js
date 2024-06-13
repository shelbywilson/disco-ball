// 🪩 fork from Ksenia Kondrashova https://codepen.io/ksenia-k/pen/ZEjJxWQ

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const container = document.querySelector('.container');
const canvasEl = document.querySelector('#canvas');

let renderer, clock, texture, scenes = [];

const loader = new OBJLoader();

let objects = [null];

loader.load('models/Soy sauce.obj', function (obj) {
    objects[0] =
    {
        geometry: { ...obj },
        mirrorSize: .0012,
        isObject: true,
    };

    init();
});


function init() {
    initScene();
    window.addEventListener('resize', updateSceneSize);

    function initScene() {

        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas: canvasEl
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        clock = new THREE.Clock();

        new THREE.TextureLoader().load(
            'bg3.png',
            (t) => {
                texture = t;
                for (let i = 0; i < objects.length; i++) {
                    scenes.push(createScene(i));
                }
                updateSceneSize();
                render();
            });
    }

    function createDiscoBall(idx) {
        const dummy = new THREE.Object3D();

        const mirrorMaterial = new THREE.MeshMatcapMaterial({
            matcap: texture
        });

        const object = objects[idx];
        let geometryOriginal = object.isObject ? object.geometry.children[0].geometry : object.geometry;
        geometryOriginal.deleteAttribute('normal');
        geometryOriginal.deleteAttribute('uv');
        geometryOriginal = BufferGeometryUtils.mergeVertices(geometryOriginal);
        geometryOriginal.computeVertexNormals();

        const mirrorGeometry = new THREE.PlaneGeometry(objects[idx].mirrorSize, objects[idx].mirrorSize);
        let instancedMirrorMesh = new THREE.InstancedMesh(
            mirrorGeometry,
            mirrorMaterial,
            geometryOriginal.attributes.position.count
        );

        const positions = geometryOriginal.attributes.position.array;
        const normals = geometryOriginal.attributes.normal.array;
        for (let i = 0; i < positions.length; i += 3) {
            dummy.position.set(positions[i], positions[i + 1], positions[i + 2]);
            dummy.lookAt(positions[i] + normals[i], positions[i + 1] + normals[i + 1], positions[i + 2] + normals[i + 2]);
            dummy.updateMatrix();
            instancedMirrorMesh.setMatrixAt(i / 3, dummy.matrix);
        }

        const obj = new THREE.Group();
        const innerGeometry = geometryOriginal.clone();
        const ballInnerMaterial = new THREE.MeshBasicMaterial({ color: 0x452624 });
        const innerMesh = new THREE.Mesh(
            innerGeometry,
            ballInnerMaterial
        );
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 32, 32), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.2, metalness: 0.5 }));
        rightEye.position.set(-0.01, 0.0866, 0.027);
        const leftEye = rightEye.clone();
        leftEye.position.set(0.013, 0.083, 0.0282);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 32, 32), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.7 }));
        nose.scale.set(1.4, 1.15, 1.0);
        nose.position.y = 0.078;
        nose.position.z = 0.04;
        nose.position.x = 0.001;
        innerMesh.add(rightEye);
        innerMesh.add(leftEye);
        innerMesh.add(nose);

        obj.add(innerMesh, instancedMirrorMesh);

        return obj;
    }

    function createScene(geometryIdx) {
        const scene = new THREE.Scene();
        scene.position.y = -0.25;

        const element = document.createElement('div');
        element.className = 'overlay-block';
        scene.userData.element = element;
        container.appendChild(element);

        const camera = new THREE.PerspectiveCamera(22, scene.userData.element.clientWidth / scene.userData.element.clientHeight, 0.5, 10);
        // camera.position.y = 3
        // camera.position.x = 0;
        // camera.position.z = 2;
        // camera.up.set(0 , 0, 0 );
        let offset = window.innerHeight < 768 ?  new THREE.Vector3( 0, 0.1, -2.0 ) : new THREE.Vector3( 0, 0.1, -1.5 )

        camera.position.addVectors( scene.position, offset )

        scene.userData.camera = camera;

        const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 3;
        controls.enableZoom = true;
        controls.enableDamping = true;
        controls.enableRotate = true;
        scene.userData.controls = controls;

        scene.add(createDiscoBall(geometryIdx));

        // var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
        // hemiLight.position.set(0, -5, 0);
    
        // scene.add(hemiLight);
    
        var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(-5, 12, 5);
        // dirLight.castShadow = true;
        // dirLight.shadow.mapSize = new THREE.Vector2(5524, 5524);
    
        scene.add(dirLight);

        return scene;
    }

    function render() {

        renderer.setScissorTest(true);
        const delta = .04 * clock.getDelta();

        scenes.forEach((scene, idx) => {
            const rect = scene.userData.element.getBoundingClientRect();
            const width = rect.right - rect.left;
            const height = rect.bottom - rect.top;
            const left = rect.left;
            const bottom = renderer.domElement.clientHeight - rect.bottom;

            renderer.setViewport(left, bottom, width, height * 2);
            renderer.setScissor(left, bottom, width, height * 2);

            scene.userData.controls.update();

            // if (idx === 0) {
            //     scene.children[0].rotateX(delta);
            //     scene.children[0].rotateZ(delta);
            // } else if (idx === 2) {
            //     scene.children[0].rotateZ(-3 * delta);
            // }
            // scene.children[0].position.x = Math.cos(clock.getElapsedTime() / 1 + (Math.sin(idx) * 5)) * 0.05;
            // scene.children[0].rotation.z += (Math.cos(clock.getElapsedTime() / 10  + idx / 10) + 1) / 2 * Math.PI / 40;

            // scene.children[0].rotation.z += delta * Math.cos(idx)

            const scale = window.innerWidth < 768 ? 1 : 1.75;
            scene.children[0].scale.x = scale;
            scene.children[0].scale.y = scale;
            scene.children[0].scale.z = scale;
            scene.children[0].rotation.y = Math.PI;


            // scene.children[0].position.z = 0.
            // scene.children[0].rotation.x = (-Math.PI/2);

            // if (idx === 0) {
            // scene.children[0].rotateZ(16 * delta);
            // scene.children[0].rotateY(6 * delta);
            // } else if (idx === 1) {
            // scene.children[0].rotateY(-10 * delta);
            // scene.children[0].rotateX(-6 * delta);
            // } else if (idx === 2) {
            //     scene.children[0].rotateX(-7 * delta);
            // } else if (idx === 3) {
            //     scene.children[0].rotateY(12 * delta);
            //     scene.children[0].rotateZ(3 * delta);
            // }

            // scene.children[0].position.z = Math.sin(delta) * 0.1;

            renderer.render(scene, scene.userData.camera);
        });

        requestAnimationFrame(render);
    }

    function updateSceneSize() {
        scenes.forEach(scene => {
            scene.userData.camera.aspect = scene.userData.element.clientWidth / (scene.userData.element.clientHeight * 2);
            scene.userData.camera.updateProjectionMatrix();

            // scene.position.z = 0.17;
            // scene.rotation.x = -Math.PI / 2;    
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

};