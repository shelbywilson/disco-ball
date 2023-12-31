// 🪩 fork from Ksenia Kondrashova https://codepen.io/ksenia-k/pen/ZEjJxWQ

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

const container = document.querySelector('.container');
const canvasEl = document.querySelector('#canvas');

let renderer, clock, texture, scenes = [];

const loader = new FontLoader();

loader.load('https://unpkg.com/three@0.77.0/examples/fonts/helvetiker_regular.typeface.json', function (font) {

    const text = new TextGeometry('2', {
        font: font,
        size: 80,
        height: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 10,
        bevelSize: 8,
        bevelOffset: 0,
        bevelSegments: 5
    });

    const objects = [{
        geometry: new THREE.TorusKnotGeometry(.25, .2, 64, 12),
        mirrorSize: .08,
    }, {
        geometry: new THREE.IcosahedronGeometry(.8, 5),
        mirrorSize: .11,
    }, {
        geometry: new THREE.TorusGeometry(.35, .2, 12, 24).rotateX(-.4),
        mirrorSize: .08,
    },
    ]

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

        let geometryOriginal = objects[idx].geometry;
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

        const camera = new THREE.PerspectiveCamera(50, scene.userData.element.clientWidth / scene.userData.element.clientHeight, 1, 10);
        camera.position.z = 2;
        scene.userData.camera = camera;

        const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
        controls.minDistance = 2;
        controls.maxDistance = 5;
        controls.autoRotate = true;
        controls.autoRotateSpeed = geometryIdx === 1 ? 4 : 6;
        controls.enableZoom = false;
        controls.enableDamping = true;
        scene.userData.controls = controls;

        scene.add(createDiscoBall(geometryIdx));

        return scene;
    }

    function render() {

        renderer.setScissorTest(true);
        const delta = .1 * clock.getDelta();

        scenes.forEach((scene, idx) => {
            const rect = scene.userData.element.getBoundingClientRect();
            const width = rect.right - rect.left;
            const height = rect.bottom - rect.top;
            const left = rect.left;
            const bottom = renderer.domElement.clientHeight - rect.bottom;

            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);

            scene.userData.controls.update();

            if (idx === 0) {
                scene.children[0].rotateX(delta);
                scene.children[0].rotateZ(delta);
            } else if (idx === 2) {
                scene.children[0].rotateZ(-3 * delta);
            }

            const ballInnerMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
            const innerMesh = new THREE.Mesh(
                text,
                ballInnerMaterial
            );

            scene.add(innerMesh);

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