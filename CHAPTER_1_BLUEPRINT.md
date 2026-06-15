# CHAPTER 1 IMPLEMENTATION BLUEPRINT: COZY FARMING & ENGLISH PUZZLE

Tài liệu này trình bày chi tiết sơ đồ kỹ thuật chi tiết của Chương 1, tập trung vào việc quản lý, tải, ánh xạ tài nguyên 3D (Models) và thiết lập hệ thống định tuyến âm thanh (Web Audio API) trong khuôn khổ **Kiến trúc Sạch (Clean Architecture)**.

---

## 1. PHÂN BỐ KIẾN TRÚC SẠCH TRONG CHƯƠNG 1 (CLEAN ARCHITECTURE LAYOUT)

Để cô lập logic hiển thị và âm thanh khỏi logic nghiệp vụ, các thành phần được phân bổ như sau:

*   **Entities (js/domain/models/)**: Định nghĩa các thực thể nghiệp vụ thuần túy không chứa code Three.js hoặc Web Audio API.
    *   `Player`: Lưu trữ `gold`, `energy`, `inventory` (hạt giống, nông sản).
    *   `Crop`: Lưu trữ `id`, `type`, `growthStage`, `watered`, `growthProgress`.
    *   `Plot`: Lưu trữ `id`, `position` (grid x, z), `crop` (null hoặc Crop), `status` ('grass', 'soil').
*   **Use Cases (js/usecases/actions/)**: Xử lý logic hành động độc lập, tuân thủ nguyên tắc Single Responsibility.
    *   `PlantCropAction`: Gieo hạt (kiểm tra ô đất trống, trừ hạt giống, tạo Crop).
    *   `WaterCropAction`: Tưới nước (cập nhật trạng thái tưới, trừ năng lượng).
    *   `HarvestCropAction`: Thu hoạch (xác nhận độ chín, xóa Crop, cộng nông sản/kinh nghiệm).
    *   `SubmitAnswerAction`: Kiểm tra câu trả lời tiếng Anh (cộng vàng/vật phẩm nếu đúng, trừ năng lượng nếu sai).
    *   `UnlockBuildingAction`: Mở khóa các công trình nông trại (chuồng bò, cối xay gió, giếng nước).
*   **Interface Adapters (js/adapters/)**:
    *   `AssetPresenter.js`: Cầu nối trung gian chịu trách nhiệm nhận các thực thể (như Crop, Plot, Player, Animal) và chuyển đổi/ánh xạ chúng thành các mô hình 3D (Three.js Mesh/Group) tương ứng, thiết lập tỷ lệ (scale), gốc tọa độ (pivot) và đăng ký hiệu ứng hoạt cảnh (sway/grow).
    *   `GameController.js`: Đọc Feature Flags từ `GameSettings.js` và điều phối luồng xử lý (kêu gọi các Action Use Cases tương ứng dựa trên cấu hình).
    *   `UIController.js`: Quản lý các sự kiện click chuột, Raycast 3D để xác định tương tác với ô đất/NPC, và cập nhật giao diện DOM HUD.
*   **Frameworks & Drivers (js/infra/)**:
    *   `ThreeRenderer.js`: Thiết lập Scene, Camera, Render loop chính.
    *   `SoundSystem.js`: Tích hợp Web Audio API trực tiếp, nạp các tệp âm thanh `.wav` và cung cấp đồ thị định tuyến (Audio Node Graph) cho nhạc nền (BGM), tiếng động vật 3D (Positional Audio) và SFX.

---

## 2. QUY CHUẨN ÁNH XẠ VÀ CĂN CHỈNH MÔ HÌNH 3D (ASSET PRESENTER SPECIFICATIONS)

`AssetPresenter` sẽ chịu trách nhiệm tải các tệp GLB và cấu hình chúng trước khi đưa vào Scene. Dưới đây là bảng thông số căn chỉnh cho các tài nguyên chính trong Chương 1.

### 2.1. Bảng cấu hình tỷ lệ và tên mô hình

| Loại Thực Thể (Entity Type) | Model Key | Đường dẫn tệp GLB | Tỷ lệ Scale đề xuất | Gốc tọa độ Y (Pivot) | Nhóm Hoạt Cảnh (Animation Groups) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Player** | `farmer` | `/assets/models/farmer.glb` | `1.5` | Đáy Bounding Box ($Y = 0$) | Tích hợp Mixer (Walk/Run/Idle) |
| **NPC Guide** | `grandpa` | `/assets/models/grandpa.glb` | `1.5` | Đáy Bounding Box ($Y = 0$) | Tĩnh / Idle Mixer |
| **NPC Merchant** | `merchant` | `/assets/models/merchant.glb` | `1.5` | Đáy Bounding Box ($Y = 0$) | Tĩnh / Idle Mixer |
| **NPC Seed Seller** | `seedseller` | `/assets/models/seedseller.glb` | `1.5` | Đáy Bounding Box ($Y = 0$) | Tĩnh / Idle Mixer |
| **Crop Tomato** | `tomato` | `/assets/models/tomato.glb` | `1.0` | Đáy Chậu đất nung ($Y = 0$) | `sway_group`, `scale_group` |
| **Crop Carrot** | `carrot` | `/assets/models/carrot.glb` | `1.0` | Đáy Chậu đất nung ($Y = 0$) | `sway_group`, `scale_group` |
| **Crop Corn** | `corn` | `/assets/models/corn.glb` | `1.0` | Đáy Chậu đất nung ($Y = 0$) | `sway_group`, `scale_group` |
| **Animal Cow** | `cow` | `/assets/models/cow.glb` | `1.8` | Đáy chân chạm đất | Tĩnh / Random Wander |
| **Animal Sheep** | `sheep` | `/assets/models/sheep.glb` | `1.2` | Đáy chân chạm đất | Tĩnh / Random Wander |
| **Animal Chicken** | `chicken` | `/assets/models/chicken.glb` | `0.6` | Đáy chân chạm đất | Tĩnh / Random Wander |
| **Animal Duck** | `duck` | `/assets/models/duck.glb` | `0.6` | Đáy chân chạm đất | Tĩnh / Floating on River |
| **Building Barn** | `barn` | `/assets/models/barn.glb` | `10.0` | Trung tâm nền móng nhà | Tĩnh (Cản va chạm) |
| **Environment Tree** | `tree` | `/assets/models/tree.glb` | `1.0` | Đáy gốc cây | `sway_group` |

### 2.2. Thuật toán Căn chỉnh Pivot động (Dynamic Pivot Alignment)
Khi tải bất kỳ mô hình GLB nào, để tránh vật thể bị lún hoặc bay lơ lửng, `AssetPresenter` sẽ:
1. Tính toán Bounding Box của mô hình:
   ```javascript
   const box = new THREE.Box3().setFromObject(gltf.scene);
   ```
2. Tính toán độ lệch Y để đưa đáy vật thể về 0:
   ```javascript
   const bottomY = box.min.y;
   const centerX = (box.max.x + box.min.x) / 2;
   const centerZ = (box.max.z + box.min.z) / 2;
   ```
3. Dịch chuyển các mesh con bên trong theo trục Y ngược lại để điểm gốc (0,0,0) nằm ở chính giữa đáy:
   ```javascript
   gltf.scene.position.set(-centerX, -bottomY, -centerZ);
   ```
4. Bọc mô hình trong một nhóm `THREE.Group` mới để giữ sạch tọa độ gốc (0,0,0) cho việc di chuyển vị trí thế giới.

### 2.3. Đăng ký Wind Sway & Growth Animation
*   **Wind Sway**: Duyệt đệ quy tìm các node có tên chứa `"sway_group"` hoặc `"leaves_group"`. Lưu tham chiếu của các node này kèm theo tọa độ thế giới ban đầu của chúng để bộ render tính toán độ lệch góc đung đưa:
    $$\theta_{x} = \sin(t \times \text{speed} + \text{worldX} \times 0.05) \times \text{amplitude}$$
    *Trong code loop:*
    ```javascript
    const time = performance.now() * 0.001;
    swayNodes.forEach(node => {
        const worldPos = new THREE.Vector3();
        node.getWorldPosition(worldPos);
        const phase = worldPos.x * 2.5 + worldPos.z * 1.8;
        node.rotation.z = Math.sin(time * 1.5 + phase) * 0.08;
    });
    ```
*   **Growth Animation**: Nếu mô hình chứa node `"scale_group"`, `AssetPresenter` sẽ cung cấp hàm `triggerGrowth(mesh, duration)` để kích hoạt quá trình lớn lên của cây trồng từ $0.01$ lên $1.0$ sử dụng nội suy tuyến tính (lerp) theo thời gian.

---

## 3. THIẾT KẾ ĐỊNH TUYẾN ÂM THANH CHƯƠNG 1 (SOUND SYSTEM ROUTING SCHEMA)

`SoundSystem` sử dụng **Web Audio API** tích hợp sẵn trong trình duyệt để cung cấp trải nghiệm âm thanh sống động mà không bị trễ tiếng (latency) và hỗ trợ không gian hóa âm thanh 3D.

### 3.1. Sơ đồ định tuyến nút âm thanh (Audio Nodes Graph)

```
[ BGM Source ] ──────> [ BGM GainNode ] ─────────┐
                                                 │
[ Ambience Source ] ─> [ Ambience GainNode ] ────┼─> [ Master GainNode ] ─> [ AudioContext Destination ]
                                                 │
[ SFX Sources ] ─────> [ SFX GainNode ] ─────────┤
                                                 │
[ Animal Source ] ───> [ PannerNode (3D) ] ──────┘
```

*   **AudioContext**: Trình quản lý luồng âm thanh trung tâm. Khởi tạo ở chế độ `suspended` và kích hoạt tự động (`resume()`) sau tương tác đầu tiên của người dùng (Click chuột/Bàn phím) để tuân thủ chính sách Autoplay của trình duyệt.
*   **GainNode (Volume Control)**:
    *   `MasterGain`: Quản lý âm lượng tổng thể của trò chơi.
    *   `BGMGain`: Điều chỉnh độc lập nhạc nền (ví dụ: giảm âm lượng khi bắt đầu câu đố).
    *   `AmbienceGain`: Điều chỉnh tiếng gió rào rào và chim hót trong nền.
    *   `SFXGain`: Quản lý tiếng gieo hạt, tưới nước, cuốc đất, tiếng click và âm báo đúng/sai.
*   **PannerNode (3D Positional Audio)**:
    *   Sử dụng mô hình khoảng cách tuyến tính (`linear` hoặc `exponential`) để tính toán mức độ suy giảm âm thanh của động vật dựa trên khoảng cách của chúng đến Camera/Player.
    *   Tần số cập nhật vị trí listener: Đồng bộ tọa độ listener của AudioContext với vị trí camera ở mỗi khung hình:
        ```javascript
        const time = audioContext.currentTime;
        audioContext.listener.positionX.setValueAtTime(camera.position.x, time);
        audioContext.listener.positionY.setValueAtTime(camera.position.y, time);
        audioContext.listener.positionZ.setValueAtTime(camera.position.z, time);
        
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        audioContext.listener.forwardX.setValueAtTime(cameraDirection.x, time);
        audioContext.listener.forwardY.setValueAtTime(cameraDirection.y, time);
        audioContext.listener.forwardZ.setValueAtTime(cameraDirection.z, time);
        ```

### 3.2. Danh sách Mappings và Kiểu phát SFX

1.  **BGM Loop**: Nạp `bgm_relaxing.wav`, tự động cài đặt `loop = true` và phai mượt (Fade-in/Fade-out) khi chuyển cảnh.
2.  **Environmental Ambience**:
    *   `birds.wav`: Phát ngẫu nhiên cách quãng (Random interval playback) sau mỗi 15 - 45 giây để mô phỏng chim rừng thực tế.
    *   `wind.wav`: Phát lặp ở mức âm lượng rất nhỏ (`0.15`).
    *   `water.wav`: Được gắn vào dòng sông dưới dạng positional audio 3D (tọa độ sông thực tế trên bản đồ).
3.  **Farming SFX (One-shot playback)**:
    *   `dig.wav`: Kích hoạt khi cuốc đất.
    *   `seed.wav`: Kích hoạt khi gieo hạt.
    *   `water_spray.wav`: Kích hoạt khi tưới cây.
    *   `harvest.wav`: Kích hoạt khi thu hoạch.
4.  **UI/Puzzle SFX (Immediate feedback)**:
    *   `click.wav`: Tiếng bấm nút.
    *   `correct.wav`: Tiếng chuông reo báo trả lời đúng.
    *   `wrong.wav`: Tiếng còi buzzer báo trả lời sai.
    *   `victory.wav`: Phát khi hoàn thành chuỗi câu đố.

---

## 4. Kế hoạch Xây dựng Mã nguồn Chương 1

1.  **Khởi tạo `SoundSystem.js`**:
    *   Thiết lập Web Audio API Context.
    *   Hàm nạp trước (preload) các file âm thanh từ thư mục `assets/audio/` và lưu trữ dưới dạng `AudioBuffer`.
    *   Viết các phương thức `playBGM()`, `playSFX()`, `playPositionalSFX()`, `setVolume()`.
2.  **Khởi tạo `AssetPresenter.js`**:
    *   Tích hợp `GLTFLoader`.
    *   Hàm nạp trước (preload) các mô hình GLB và lưu trữ cache.
    *   Hàm `createModelInstance(modelKey)` thực hiện nhân bản (clone) mô hình từ cache, áp dụng căn chỉnh pivot, thiết lập scale và đăng ký sway/grow.
    *   Hàm `update(delta)` cập nhật hoạt cảnh đung đưa trước gió cho toàn bộ các node đã đăng ký.
3.  **Kiểm tra và Liên kết**:
    *   Liên kết hai hệ thống adapter và infrastructure mới này vào cấu trúc trò chơi, chuẩn bị sẵn sàng cho việc nạp nhân vật, vật nuôi và các hoạt động canh tác nông nghiệp ở các chương tiếp theo.
