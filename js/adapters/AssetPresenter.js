// js/adapters/AssetPresenter.js
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

export class AssetPresenter {
    constructor(scene) {
        this.scene = scene;
        this.loader = new GLTFLoader();
        this.cache = new Map(); // Lưu trữ các GLTF template tải trước
        this.activeAssets = new Map(); // key: Entity ID hoặc instance ID, value: Group bọc Mesh
        this.swayNodes = []; // { node, worldPosition, phase }
        this.growNodes = []; // { node, targetScale, timer, duration, onComplete }

        // Bảng ánh xạ tỷ lệ kích thước (Scale) từ CHAPTER_1_BLUEPRINT.md
        // Tối ưu hóa tỷ lệ cho vừa vặn với môi trường và cân đối
        // Phóng to con người và động vật lên nữa, thu nhỏ nhà cửa nhỏ lại xíu để tránh chênh lệch quá lớn
        this.scaleMappings = {
            farmer: 6.0,
            grandpa: 6.0,
            merchant: 6.0,
            seedseller: 6.0,
            tomato: 2.2,
            carrot: 2.2,
            corn: 2.2,
            cow: 6.5,
            sheep: 5.5,
            chicken: 3.0,
            duck: 3.0,
            barn: 2.2,
            silo: 1.8,
            tree: 2.5,
            compostbin: 15.0,
            waterpump: 15.0
        };
    }

    // Nạp trước các tệp mô hình GLB chạy bất đồng bộ
    async preloadModel(key, url) {
        if (this.cache.has(key)) return this.cache.get(key);

        return new Promise((resolve) => {
            this.loader.load(
                url,
                (gltf) => {
                    this.cache.set(key, gltf);
                    console.log(`AssetPresenter: Preloaded model [${key}] from ${url}`);
                    resolve(gltf);
                },
                undefined,
                (error) => {
                    console.error(`AssetPresenter: Error loading model [${key}] from ${url}`, error);
                    resolve(null);
                }
            );
        });
    }

    // Tạo một thực thể hiển thị từ model key
    createModelInstance(modelKey, entityId = null) {
        const gltf = this.cache.get(modelKey);
        if (!gltf) {
            console.warn(`AssetPresenter: Model [${modelKey}] is not preloaded.`);
            return null;
        }

        // Nhân bản scene của mô hình
        const modelClone = gltf.scene.clone();

        // 1. Tính toán Bounding Box để căn chỉnh Pivot động
        const box = new THREE.Box3().setFromObject(modelClone);
        const bottomY = box.min.y;
        const centerX = (box.max.x + box.min.x) / 2;
        const centerZ = (box.max.z + box.min.z) / 2;

        // 2. Dịch chuyển các mesh con để đưa đáy vật thể về Y = 0 và tâm X = 0, Z = 0
        modelClone.position.set(-centerX, -bottomY, -centerZ);

        // 3. Tạo Group bọc mô hình mới để giữ nguyên điểm gốc (0,0,0) cho việc định vị thế giới
        const wrapperGroup = new THREE.Group();
        wrapperGroup.add(modelClone);

        // Gán Scale chuẩn
        const baseScale = this.scaleMappings[modelKey] || 1.0;
        wrapperGroup.scale.set(baseScale, baseScale, baseScale);

        // 4. Tìm kiếm các Node hoạt cảnh (sway_group / leaves_group)
        wrapperGroup.traverse((child) => {
            if (child.name && (child.name.includes('sway_group') || child.name.includes('leaves_group'))) {
                const worldPos = new THREE.Vector3();
                child.getWorldPosition(worldPos);
                // Tạo pha lệch lượng giác dựa trên tọa độ thế giới
                const phase = worldPos.x * 2.5 + worldPos.z * 1.8;
                this.swayNodes.push({
                    node: child,
                    phase: phase
                });
            }
        });

        // Đăng ký hoạt cảnh AnimationMixer nếu mô hình có chứa animations
        if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(modelClone);
            wrapperGroup.userData.mixer = mixer;
            wrapperGroup.userData.animations = gltf.animations;
        }

        if (entityId) {
            this.activeAssets.set(entityId, wrapperGroup);
        }

        return wrapperGroup;
    }

    // Đặt vị trí thế giới của thực thể
    setAssetPosition(entityId, x, y, z) {
        const group = this.activeAssets.get(entityId);
        if (group) {
            group.position.set(x, y, z);
        }
    }

    // Đặt góc quay (trục Y)
    setAssetRotation(entityId, angleRad) {
        const group = this.activeAssets.get(entityId);
        if (group) {
            group.rotation.y = angleRad;
        }
    }

    // Kích hoạt hoạt cảnh lớn lên từ 0.01 -> 1.0
    triggerGrowth(entityId, duration = 5.0) {
        const group = this.activeAssets.get(entityId);
        if (!group) return;

        // Tìm node scale_group bên trong group
        let scaleNode = null;
        group.traverse((child) => {
            if (child.name && child.name.includes('scale_group')) {
                scaleNode = child;
            }
        });

        const targetNode = scaleNode || group; // fallback về cả group nếu không tìm thấy scale_group
        targetNode.scale.set(0.01, 0.01, 0.01);

        this.growNodes = this.growNodes.filter(item => item.node !== targetNode); // tránh trùng lặp
        this.growNodes.push({
            node: targetNode,
            targetScale: 1.0,
            timer: 0.0,
            duration: duration
        });
    }

    // Xóa thực thể hiển thị khỏi scene
    removeAsset(entityId) {
        const group = this.activeAssets.get(entityId);
        if (!group) return;

        this.scene.remove(group);
        this.activeAssets.delete(entityId);

        // Giải phóng bộ nhớ toàn diện theo rules.md
        group.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });

        // Dọn dẹp nodes hoạt cảnh liên quan
        this.swayNodes = this.swayNodes.filter(item => !group.getObjectById(item.node.id));
        this.growNodes = this.growNodes.filter(item => item.node !== group);
    }

    // Cập nhật vòng lặp hoạt cảnh
    update(deltaTime) {
        const time = performance.now() * 0.001;

        // 1. Cập nhật hoạt cảnh Wind Sway
        this.swayNodes.forEach((item) => {
            // Đung đưa nhẹ qua lại theo hàm sin lệch pha
            item.node.rotation.z = Math.sin(time * 1.5 + item.phase) * 0.08;
        });

        // 2. Cập nhật hoạt cảnh Growth
        for (let i = this.growNodes.length - 1; i >= 0; i--) {
            const grow = this.growNodes[i];
            grow.timer += deltaTime;
            const progress = Math.min(1.0, grow.timer / grow.duration);
            
            // Nội suy tuyến tính (lerp) kích thước
            const currentScale = 0.01 + (grow.targetScale - 0.01) * progress;
            grow.node.scale.set(currentScale, currentScale, currentScale);

            if (progress >= 1.0) {
                if (grow.onComplete) grow.onComplete();
                this.growNodes.splice(i, 1);
            }
        }

        // 3. Cập nhật Mixer hoạt cảnh GLB (nếu có)
        this.activeAssets.forEach((group) => {
            if (group.userData && group.userData.mixer) {
                group.userData.mixer.update(deltaTime);
            }
        });
    }
}
