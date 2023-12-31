// 🪩 fork from Ksenia Kondrashova https://codepen.io/ksenia-k/pen/ZEjJxWQ

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const container = document.querySelector('.container');
const canvasEl = document.querySelector('#canvas');

let renderer, clock, texture, scenes = [];

const loader = new OBJLoader();

let objects = [null, null, null, null];

loader.load('models/2.obj', function (obj2) {
    objects[0] = 
    {
        geometry: obj2,
        mirrorSize: .008,
        isObject: true,
    };
});

loader.load('models/0.obj', function (obj0) {
    objects[1] = 
    {
        geometry: obj0,
        mirrorSize: .008,
        isObject: true,
    }
});
loader.load('models/2.obj', function (obj2) {
    objects[2] = 
    {
        geometry: obj2,
        mirrorSize: .008,
        isObject: true,
    };
});

loader.load('models/4.obj', function (obj4) {
    objects[3] = 
    {
        geometry: obj4,
        mirrorSize: .008,
        isObject: true,
    }

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
        let geometryOriginal =  object.isObject ? object.geometry.children[0].geometry : object.geometry;
        geometryOriginal.deleteAttribute('normal');
        geometryOriginal.deleteAttribute('uv');
        geometryOriginal = BufferGeometryUtils.mergeVertices(geometryOriginal);
        geometryOriginal.computeVertexNormals();
        // geometryOriginal.translateY(-0.1);

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
        const ballInnerMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const innerMesh = new THREE.Mesh(
            innerGeometry,
            ballInnerMaterial
        );
        obj.add(innerMesh, instancedMirrorMesh);

        return obj;
    }

    function createScene(geometryIdx) {
        const scene = new THREE.Scene();

        const element = document.createElement('div');
        element.className = 'overlay-block';
        scene.userData.element = element;
        container.appendChild(element);

        const camera = new THREE.PerspectiveCamera(12, scene.userData.element.clientWidth / scene.userData.element.clientHeight, 1, 10);
        // camera.position.z = 2;
        scene.userData.camera = camera;

        const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
        controls.minDistance = 2;
        controls.maxDistance = 5;
        // controls.autoRotate = true;
        controls.autoRotateSpeed = 6;
        controls.enableZoom = false;
        controls.enableDamping = true;
        scene.userData.controls = controls;

        scene.add(createDiscoBall(geometryIdx));

        return scene;
    }

    function render() {

        renderer.setScissorTest(true);
        const delta = .08 * clock.getDelta();

        scenes.forEach((scene, idx) => {
            const rect = scene.userData.element.getBoundingClientRect();
            const width = rect.right - rect.left;
            const height = rect.bottom - rect.top;
            const left = rect.left;
            const bottom = renderer.domElement.clientHeight - rect.bottom;

            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);

            scene.userData.controls.update();

            // if (idx === 0) {
            //     scene.children[0].rotateX(delta);
            //     scene.children[0].rotateZ(delta);
            // } else if (idx === 2) {
            //     scene.children[0].rotateZ(-3 * delta);
            // }

            if (idx === 0) {
                scene.children[0].rotateZ(16 * delta);
            } else if (idx === 1) {
                scene.children[0].rotateY(-10 * delta);
            } else if (idx === 2) {
                scene.children[0].rotateX(-14 * delta);
            } else if (idx === 3) {
                scene.children[0].rotateY(12 * delta);
            }

            scene.children[0].position.z = Math.sin(delta) * 0.1;

            renderer.render(scene, scene.userData.camera);
        });

        requestAnimationFrame(render);
    }

    function updateSceneSize() {
        scenes.forEach(scene => {
            scene.userData.camera.aspect = scene.userData.element.clientWidth / scene.userData.element.clientHeight;
            scene.userData.camera.updateProjectionMatrix();
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

});