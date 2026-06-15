# 🏗️ MASTER PLAN & GAMEPLAY RESEARCH PLAN: CLEAN ARCHITECTURE & DYNAMIC GAMEPLAY
## (FARMING & ENGLISH PUZZLE V3)

> **[LỆNH ĐIỀU HÀNH DÀNH CHO AI AGENT]**
> Đóng vai trò là một **Chuyên gia Kiến trúc Phần mềm (Software Architect)** và **Trưởng nhóm Lập trình (Lead Developer)**.
> **Ưu tiên tối thượng:** CẤU TRÚC MÃ NGUỒN, KHẢ NĂNG BẢO TRÌ, TẤT CẢ PHẢI TUÂN THỦ CLEAN ARCHITECTURE VÀ RULES.MD.
> Hệ thống phải được thiết kế sao cho mô-đun "Học Tiếng Anh" (English Puzzle) có thể tắt/bật linh hoạt qua Feature Flags mà không ảnh hưởng tới logic nông trại cốt lõi.
>
> **Quy trình làm việc bắt buộc của AI:**
> 1. **Lập kế hoạch (Plan):** Đọc kỹ tài liệu, phân rã công việc trước khi gõ phím.
> 2. **Thực thi (Execute):** Viết mã sạch, kiểm tra Feature Flags trước khi hiển thị UI hoặc kích hoạt luồng giải đố.
> 3. **Lưu lịch sử (Log/Track):** Cập nhật tiến độ vào file `AI_DEV_HISTORY.md` sau mỗi bước hoàn thành.

---

## CHƯƠNG 1: KIẾN TRÚC SẠCH & HỆ THỐNG FEATURE FLAGS (ƯU TIÊN HÀNG ĐẦU)

Để đáp ứng yêu cầu chuyển đổi định hướng (pivot) dễ dàng trong tương lai (ví dụ: chuyển từ game học tiếng Anh sang game nông trại thuần túy), hệ thống sử dụng **Clean Architecture 4 lớp** kết hợp với cấu hình **Feature Flags** động.

### 1.1. Hệ thống Feature Flags (Quản trị tính năng động)
Mọi tính năng có khả năng thay đổi hoặc loại bỏ trong tương lai đều phải được quản lý tập trung thông qua biến cấu hình toàn cục tại `js/domain/config/GameSettings.js`.

```javascript
// js/domain/config/GameSettings.js
export const FEATURE_FLAGS = {
    ENABLE_ENGLISH_PUZZLE: true,       // Bật/tắt toàn bộ hệ thống giải đố Tiếng Anh
    ENABLE_WEED_TYPING_MINIGAME: true,  // Bật/tắt minigame gõ chữ để diệt cỏ dại
    REQUIRE_WATERING: true,             // Bật/tắt yêu cầu tưới nước bắt buộc để cây lớn
    ENABLE_DAY_NIGHT_CYCLE: false       // Bật/tắt chu kỳ ngày đêm (tùy chọn mở rộng)
};
```

**Cách hoạt động ở lớp Adapters (`GameController.js`):**
Khi người chơi tương tác với một công trình bị khóa hoặc NPC:
* Nếu `ENABLE_ENGLISH_PUZZLE === true`: Hệ thống hiển thị hộp thoại câu đố, gọi `SubmitAnswerAction.js`. Người chơi trả lời đúng mới được mở khóa/nhận hạt giống.
* Nếu `ENABLE_ENGLISH_PUZZLE === false`: Hệ thống bỏ qua bước giải đố. Trực tiếp thực hiện trừ Vàng (Gold) và gọi `UnlockBuildingAction.js` để mở khóa công trình, hoặc hiển thị UI mua bán hạt giống/vật phẩm thông thường.

---

### 1.2. Mô hình 4 lớp độc lập (Clean Architecture)

```
┌──────────────────────────────────────────────────────────┐
│                   FRAMEWORKS & DRIVERS                   │
│         (ThreeRenderer, SoundSystem, DOMGui)             │
│   ┌──────────────────────────────────────────────────┐   │
│   │                INTERFACE ADAPTERS                │   │
│   │         (GameController, UIController)           │   │
│   │   ┌──────────────────────────────────────────┐   │   │
│   │   │                USE CASES                 │   │   │
│   │   │   (PlantCropAction, SubmitAnswerAction)  │   │   │
│   │   │   ┌──────────────────────────────────┐   │   │   │
│   │   │   │             ENTITIES             │   │   │   │
│   │   │   │     (Player, Crop, Plot, Word)   │   │   │   │
│   │   │   └──────────────────────────────────┘   │   │   │
│   │   └──────────────────────────────────────────┘   │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

1. **Lớp Entities (Thực thể - `js/domain/models/`)**:
   * Chứa cấu trúc dữ liệu và quy tắc nghiệp vụ cốt lõi (ví dụ: `Player.js` quản lý vàng/năng lượng, `Crop.js` quản lý tiến trình lớn, `Plot.js` quản lý trạng thái ô đất).
   * **Quy tắc**: Thuần Javascript, tuyệt đối không phụ thuộc vào Three.js, DOM hoặc thư viện bên ngoài.
2. **Lớp Use Cases (Hành động - `js/usecases/actions/`)**:
   * Mỗi hành động là một class/module độc lập có trách nhiệm duy nhất (Single Responsibility Principle) và triển khai hàm `execute()`.
   * Ví dụ: `PlantCropAction.js` thực hiện kiểm tra ô đất -> trừ hạt giống -> tạo thực thể `Crop`.
3. **Lớp Interface Adapters (Thích ứng - `js/adapters/`)**:
   * Cầu nối giữa Core Logic và Hạ tầng hiển thị.
   * `GameController.js` nhận sự kiện đầu vào, kiểm tra cấu hình `FEATURE_FLAGS` để điều phối các hành động (Use Cases) tương ứng.
   * `AssetPresenter.js` chuyển đổi các thực thể dữ liệu (`Plot`, `Crop`, `Player`) thành các Three.js Mesh hiển thị trên Scene, cấu hình scale, vị trí và hiệu ứng đung đưa.
4. **Lớp Frameworks & Drivers (Hạ tầng - `js/infra/`)**:
   * Chứa các công cụ và thư viện bên ngoài.
   * `ThreeRenderer.js` đảm nhận việc dựng hình 3D, thiết lập camera, ánh sáng và render loop.
   * `SoundSystem.js` trực tiếp làm việc với Web Audio API để phát nhạc nền BGM và âm thanh SFX.

---

### 1.3. Cấu trúc thư mục tiêu chuẩn
Mọi tệp tin khởi tạo mới hoặc chỉnh sửa phải tuân thủ nghiêm ngặt vị trí phân bổ sau:

```plaintext
GAMENONGTRAIV3/
├── .github/workflows/deploy.yml   # CI/CD tự động deploy lên GitHub Pages
├── AI_DEV_HISTORY.md              # Log tiến độ phát triển của AI (bắt buộc cập nhật)
├── assets/                        # Thư mục lưu trữ tài nguyên tĩnh
│   ├── models/                    # Chứa tệp mô hình 3D (.glb)
│   └── audio/                     # Chứa tệp âm thanh (.wav)
├── js/
│   ├── domain/                    # ENTITIES
│   │   ├── config/                # Chứa cấu hình trò chơi (GameSettings.js)
│   │   └── models/                # Các thực thể cốt lõi (Player.js, Plot.js, Crop.js)
│   ├── usecases/                  # USE CASES
│   │   └── actions/               # Các mô-đun hành động độc lập (PlantCropAction.js,...)
│   ├── adapters/                  # INTERFACE ADAPTERS
│   │   ├── GameController.js      # Bộ điều phối chính, kiểm tra Feature Flags
│   │   ├── UIController.js        # Nhận diện click và điều phối hiển thị DOM
│   │   └── AssetPresenter.js      # Ánh xạ thực thể dữ liệu sang Three.js Mesh
│   ├── infra/                     # FRAMEWORKS & DRIVERS
│   │   ├── ThreeRenderer.js       # Quản lý WebGLRenderer, Scene, Fog, Lights
│   │   ├── SoundSystem.js         # Quản lý Web Audio API Node Graph, BGM & SFX
│   │   ├── terrainSystem.js       # Hệ thống địa hình vô tận (đã có)
│   │   ├── chunkManager.js        # Nạp/hủy chunk địa hình (đã có)
│   │   ├── meshBuilder.js         # Dựng lưới địa hình từ worker (đã có)
│   │   ├── workerPool.js          # Hồ điều phối luồng worker (đã có)
│   │   ├── terrainWorker.js       # Xử lý nhiễu toán học trên luồng phụ (đã có)
│   │   └── inputController.js     # Điều khiển đầu vào camera (đã có)
│   └── main.js                    # Entry point khởi tạo và liên kết hệ thống
├── index.html                     # Khung giao diện HTML5
└── style.css                      # Định dạng CSS
```

---

## CHƯƠNG 2: THIẾT KẾ ACTION-BASED (MODULE HÀNH ĐỘNG ĐỘC LẬP)

Để tránh hiện tượng tệp điều khiển phình to (Monolithic Controller), toàn bộ logic nghiệp vụ được đóng gói thành các Action Class riêng biệt trong thư mục `js/usecases/actions/`.

### 2.1. Cấu trúc chuẩn hóa của một Action Class
Mỗi Action Class có nhiệm vụ duy nhất và cung cấp giao diện thực thi thông qua phương thức `execute()`.

* **`PlantCropAction.js`**:
  * **Đầu vào**: `plotId`, `seedType`, `playerEntity`, `plotRepository`.
  * **Logic**: Kiểm tra nếu ô đất trống -> Kiểm tra số lượng hạt giống của người chơi -> Trừ hạt giống -> Tạo thực thể `Crop` -> Gắn thực thể `Crop` vào `Plot`.
* **`WaterCropAction.js`**:
  * **Đầu vào**: `plotId`, `playerEntity`, `plotRepository`.
  * **Logic**: Kiểm tra nếu ô đất đã được gieo hạt và chưa được tưới -> Trừ năng lượng người chơi -> Thiết lập thuộc tính `watered = true` của cây -> Đẩy nhanh tiến trình sinh trưởng.
* **`HarvestCropAction.js`**:
  * **Đầu vào**: `plotId`, `playerEntity`, `plotRepository`.
  * **Logic**: Kiểm tra cây trồng đã chín (`growthProgress >= 1.0`) -> Xóa thực thể `Crop` khỏi `Plot` -> Thêm nông sản tương ứng vào giỏ đồ của `Player` -> Cộng điểm kinh nghiệm.
* **`SubmitAnswerAction.js`**:
  * **Đầu vào**: `questionId`, `chosenAnswer`, `playerEntity`, `wordDatabase`.
  * **Logic**:
    * Nếu đáp án **ĐÚNG**: Kích hoạt âm thanh `correct.wav`, cộng vàng (Gold) hoặc thưởng hạt giống cho `Player`.
    * Nếu đáp án **SAI**: Kích hoạt âm thanh `wrong.wav`, trừ năng lượng (Energy) hoặc vàng của `Player`.
* **`UnlockBuildingAction.js`**:
  * **Đầu vào**: `buildingId`, `playerEntity`.
  * **Logic**: Kiểm tra cờ cấu hình `FEATURE_FLAGS.ENABLE_ENGLISH_PUZZLE`:
    * **Bật (true)**: Yêu cầu người chơi hoàn thành đúng câu đố từ vựng được giao để mở khóa.
    * **Tắt (false)**: Cho phép mở khóa trực tiếp bằng cách trừ số vàng tương đương giá trị công trình.

---

## CHƯƠNG 3: NGHIÊN CỨU GAMEPLAY (CORE LOOP & EDUCATIONAL INTEGRATION)

Lối chơi của game được thiết kế linh hoạt để có thể vận hành trơn tru ở cả hai trạng thái cấu hình.

```
                   [ BẮT ĐẦU GAME ]
                           │
                           ▼
             Kiểm tra ENABLE_ENGLISH_PUZZLE
              /                         \
       (Bật - true)                (Tắt - false)
            /                             \
[ Gặp NPC / Tiếp cận cổng ]       [ Trả Vàng trực tiếp ]
[ Trả lời câu đố tiếng Anh ]      [ để mua hạt giống & ]
[  (Đúng: Nhận hạt giống) ]       [  mở khóa công trình  ]
            \                             /
             \                           /
              ▼                         ▼
         [ Gieo trồng trên ô đất cày xới (Soil) ]
                           │
                           ▼
         [ Tưới nước đẩy nhanh sinh trưởng cây ]
                           │
                           ▼
          Kiểm tra cỏ dại mọc ngẫu nhiên
          /                           \
   (Bật Typing)                  (Tắt Typing)
       /                                 \
[ Gõ từ vựng tiếng Anh ]         [ Nhấp chuột trực tiếp ]
[    để nhổ sạch cỏ    ]         [  (Tiêu tốn năng lượng) ]
          \                              /
           \                            /
            ▼                          ▼
         [ Cây chín -> Thu hoạch nông sản ]
                           │
                           ▼
         [ Bán sản phẩm lấy Vàng tại Merchant ]
```

### 3.1. Các giai đoạn tương tác chi tiết

1. **Giai đoạn Khám phá & Giao tiếp (Exploration & Dialogue)**:
   * Người chơi điều khiển nhân vật `farmer` chạy trên địa hình vô tận, tương tác với các NPC (`grandpa` hướng dẫn học, `seedseller` bán hạt giống, `merchant` mua nông sản).
   * **Cơ chế đố vui (Puzzle Enabled)**: Kích hoạt khi giao dịch hoặc nhận nhiệm vụ. Hệ thống mở UI hiển thị từ vựng tiếng Anh kèm 4 đáp án trắc nghiệm. Trả lời đúng sẽ nhận hạt giống cao cấp miễn phí.
   * **Cơ chế thuần nông nghiệp (Puzzle Disabled)**: Người chơi mua hạt giống trực tiếp từ cửa hàng bằng Vàng tích lũy.
2. **Giai đoạn Canh tác & Chăm sóc (Farming & Caring)**:
   * **Gieo hạt**: Sử dụng cuốc để xới đất (`grass` -> `soil`), chọn hạt giống và gieo.
   * **Tưới nước**: Người chơi múc nước từ giếng (`waterwell`) hoặc sông (`river`) để tưới. Khi được tưới, cây trồng sẽ chuyển sang trạng thái lớn nhanh gấp đôi.
   * **Xử lý cỏ dại (Weeds)**: Cỏ dại mọc ngẫu nhiên trên các ô đất làm chậm tiến trình phát triển của cây.
     * *Nếu `ENABLE_WEED_TYPING_MINIGAME === true*: Một từ tiếng Anh xuất hiện trên ngọn cỏ. Người chơi gõ đúng từ để nhổ cỏ.
     * *Nếu `ENABLE_WEED_TYPING_MINIGAME === false*: Người chơi click trực tiếp vào cỏ dại để nhổ (tiêu hao 5 điểm Năng lượng).
3. **Giai đoạn Thu hoạch & Thương mại (Harvest & Trade)**:
   * Khi cây trồng đạt kích thước chín hoàn toàn, người chơi tiến hành thu hoạch và cất vào giỏ đồ.
   * Di chuyển tới NPC Thương nhân (`merchant`) để bán nông sản lấy Vàng, chuẩn bị tài chính cho việc mở khóa các công trình cao cấp hơn (ví dụ: cối xay gió `windmill`, nhà kính `greenhouse`).

---

## CHƯƠNG 4: ÁNH XẠ MÔ HÌNH VÀ HỆ THỐNG ÂM THANH (ASSETS ARCHITECTURE)

Tất cả tài nguyên 3D và âm thanh phải được định tuyến và quản lý tập trung ở lớp hạ tầng nhằm tối ưu hiệu năng render.

### 4.1. Quy chuẩn Ánh xạ Mô hình 3D (`AssetPresenter.js`)
`AssetPresenter` thực hiện tải và thiết lập mô hình GLB theo các tiêu chuẩn kỹ thuật sau:

| Thực thể (Entity) | Model Key | Tỷ lệ (Scale) | Gốc tọa độ Y (Pivot) | Nhóm Hoạt Cảnh (Animation Groups) | Vật lý va chạm |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Player** | `farmer` | `1.5` | Chân chạm đất ($Y = 0$) | Mixer (`Walk`, `Run`, `Idle`) | Tròn (Radius: 1.0) |
| **NPC Guide** | `grandpa` | `1.5` | Chân chạm đất ($Y = 0$) | Tĩnh hoặc Idle Mixer | Hộp bao quanh |
| **NPC Merchant** | `merchant` | `1.5` | Chân chạm đất ($Y = 0$) | Tĩnh hoặc Idle Mixer | Hộp bao quanh |
| **NPC Seed Seller**| `seedseller`| `1.5` | Chân chạm đất ($Y = 0$) | Tĩnh hoặc Idle Mixer | Hộp bao quanh |
| **Crop Tomato** | `tomato` | `1.0` | Đáy chậu ($Y = 0$) | `sway_group`, `scale_group` | Không |
| **Crop Carrot** | `carrot` | `1.0` | Đáy chậu ($Y = 0$) | `sway_group`, `scale_group` | Không |
| **Crop Corn** | `corn` | `1.0` | Đáy chậu ($Y = 0$) | `sway_group`, `scale_group` | Không |
| **Animal Cow** | `cow` | `1.8` | Bốn chân chạm đất | Tĩnh hoặc Random Wander | Tròn (Radius: 1.5) |
| **Building Barn** | `barn` | `10.0` | Trung tâm nền móng | Tĩnh | Hộp lớn (Static Obstacle) |
| **Environment Tree**| `tree` | `1.0` | Đáy gốc cây ($Y = 0$) | `sway_group` | Tròn (Radius: 0.8) |

#### Thuật toán Căn chỉnh Pivot động (Dynamic Pivot Alignment)
Khi tải mô hình, `AssetPresenter` sẽ tự động điều chỉnh điểm gốc (Pivot) về đáy trung tâm của mô hình để đảm bảo vật thể không bị chôn dưới lòng đất hoặc bay lơ lửng:
```javascript
const box = new THREE.Box3().setFromObject(gltf.scene);
const bottomY = box.min.y;
gltf.scene.position.y -= bottomY; // Đưa đáy vật thể về Y = 0
```

#### Thuật toán Đung đưa trước gió (Wind Sway)
Các Mesh thuộc nhóm `sway_group` hoặc `leaves_group` được áp dụng độ lệch góc lượng giác trong render loop:
```javascript
const worldPosition = new THREE.Vector3();
mesh.getWorldPosition(worldPosition);
const phase = worldPosition.x * 2.5 + worldPosition.z * 1.8;
mesh.rotation.z = Math.sin(time * 1.5 + phase) * 0.08; // Đung đưa nhẹ
```

---

### 4.2. Hệ thống Định tuyến Âm thanh (`SoundSystem.js`)
Sử dụng **Web Audio API** để xây dựng đồ thị âm thanh (Audio Node Graph) tối ưu, giảm thiểu độ trễ và hỗ trợ âm thanh không gian 3D.

```
[ Nhạc nền (BGM) ] ───> [ BGM GainNode ] ─────────┐
                                                  │
[ Môi trường ] ──────> [ Ambience GainNode ] ────┼─> [ Master GainNode ] ──> [ AudioContext Destination ]
                                                  │
[ Hiệu ứng (SFX) ] ──> [ SFX GainNode ] ─────────┤
                                                  │
[ Động vật kêu ] ────> [ PannerNode (3D) ] ──────┘
```

* **Chính sách Autoplay**: AudioContext được khởi tạo ở trạng thái `suspended`. Kích hoạt phương thức `audioContext.resume()` ngay sau tương tác đầu tiên của người dùng trên trang (Click chuột hoặc nhấn phím).
* **Positional Audio (3D)**: Âm thanh động vật (`cow.wav`, `sheep.wav`) được định tuyến qua `PannerNode` để điều chỉnh âm lượng và hướng dựa trên khoảng cách và góc xoay của người chơi so với nguồn phát âm thanh.

---

## CHƯƠNG 5: ROADMAP PHÁT TRIỂN & TIẾN ĐỘ THỰC THI (ROADMAP)

### Giai đoạn 1: Khởi tạo Cơ sở hạ tầng (Clean Core Setup)
* [ ] Thiết lập tệp cấu hình `js/domain/config/GameSettings.js`.
* [ ] Định nghĩa các thực thể `Player.js`, `Plot.js`, `Crop.js` ở lớp Entities.
* [ ] Xây dựng khung lớp hạ tầng `js/infra/SoundSystem.js` và `js/infra/ThreeRenderer.js`.
* [ ] Tạo `js/adapters/AssetPresenter.js` quản lý ánh xạ mô hình GLB và căn chỉnh Pivot tự động.

### Giai đoạn 2: Lập trình Điều khiển & Khớp địa hình (Player & World)
* [ ] Nạp mô hình nhân vật `farmer.glb` và đặt tại tọa độ gốc (0, Y, 0).
* [ ] Xây dựng bộ điều khiển `PlayerController.js` bắt sự kiện WASD để di chuyển nhân vật.
* [ ] Liên kết hàm truy vấn độ cao địa hình `getTerrainHeight(x, z)` để tọa độ Y của nhân vật luôn khớp sát mặt đất nhấp nhô.
* [ ] Chuyển đổi trạng thái hoạt cảnh (`Walk`, `Run`, `Idle`) của nhân vật bằng `THREE.AnimationMixer`.

### Giai đoạn 3: Cơ chế Trồng trọt & Canh tác (Farming Core Loops)
* [ ] Viết các Action nghiệp vụ độc lập: `PlantCropAction.js`, `WaterCropAction.js`, `HarvestCropAction.js`.
* [ ] Thiết lập hệ thống Raycasting trong `UIController.js` để xác định ô đất người chơi đang nhìn vào.
* [ ] Thực thi gieo hạt, cập nhật hoạt cảnh lớn lên của mô hình quả qua thuộc tính `scale_group`.
* [ ] Áp dụng hiệu ứng đung đưa trước gió cho lá cây và lúa gạo.

### Giai đoạn 4: Bộ máy Giải đố & Học Tiếng Anh (English Puzzle Engine)
* [ ] Xây dựng cơ sở dữ liệu từ vựng `js/puzzle/wordDatabase.js`.
* [ ] Thiết lập logic `SubmitAnswerAction.js` so khớp đáp án và phân chia phần thưởng theo cấu hình Feature Flags.
* [ ] Thiết kế giao diện HTML/CSS hiển thị hộp thoại câu đố đè lên màn hình Canvas 3D.
* [ ] Viết minigame diệt cỏ dại dựa trên việc gõ chữ tương ứng với cờ `ENABLE_WEED_TYPING_MINIGAME`.

### Giai đoạn 5: Tích hợp Kinh tế & Lưu trữ (Economy & Serialization)
* [ ] Tạo NPC cửa hàng hạt giống (`seedseller`) và thương nhân thu mua nông sản (`merchant`).
* [ ] Xây dựng hệ thống túi đồ (Inventory) chứa nông sản, hạt giống và tiền vàng của người chơi.
* [ ] Cài đặt lưu trạng thái trò chơi (tọa độ nhân vật, số vàng, cây trồng) vào `localStorage`.

---

## CHƯƠNG 6: TIÊU CHUẨN TỐI ƯU HÓA & QUY TẮC CẤM (PERFORMANCE & RULES)

### 6.1. Ràng buộc Hiệu năng & Tối ưu Bộ nhớ
* **Draw Calls**: Hạn chế số lượng draw calls bằng cách gộp nhóm các vật thể tĩnh (cỏ dại, cây thông rừng) qua `THREE.InstancedMesh`.
* **Giải phóng Bộ nhớ (Memory Disposal)**: Khi hủy bỏ hoặc thay thế mô hình 3D, bắt buộc phải giải phóng bộ nhớ của hình học, vật liệu và chất liệu kết cấu:
  ```javascript
  geometry.dispose();
  material.dispose();
  texture.dispose();
  ```
* **Khung hình mục tiêu**: Đảm bảo game chạy mượt mà ở mức tối thiểu **60 FPS** trên các thiết bị phổ thông.

### 6.2. Các hành vi bị CẤM TUYỆT ĐỐI (Forbidden Patterns)
1. **CẤM TUYỆT ĐỐI** sử dụng các trình đóng gói mã nguồn (npm, Webpack, Vite) ở client. Mọi thư viện phải được nạp trực tiếp qua CDN (Vanilla JS ES Modules).
2. **CẤM** viết code tự mô phỏng hệ thống xương khớp (Skeletal Rigging) hoặc tính toán da (Skinning) phức tạp bằng mã JS thủ công. Mọi hoạt cảnh phức tạp phải được xuất trực tiếp từ Blender.
3. **CẤM** trùng lặp logic chuyển động (vừa chạy animation từ file GLB vừa gán code JS tự xoay cùng một bộ phận).
4. **CẤM TUYỆT ĐỐI** tự ý thực hiện lệnh `git push` lên repository từ xa khi chưa có sự cho phép cụ thể từ người dùng.
