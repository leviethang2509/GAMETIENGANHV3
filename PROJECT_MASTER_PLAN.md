# PROJECT MASTER PLAN - GAME NÔNG TRẠI V3 (ENGLISH FARMING PUZZLE)

Tài liệu này đóng vai trò là Bản Hoạch định Tổng thể (Master Plan) thiết lập kiến trúc kỹ thuật, lộ trình phát triển và danh sách đầu việc chi tiết từ giai đoạn Asset → Prototype → Alpha → Beta → Release của dự án Game Nông Trại V3.

---

## PHẦN 1 — KIỂM KÊ TÀI NGUYÊN HIỆN CÓ (ASSET INVENTORY)

Dự án hiện đang sở hữu hai nhóm tài nguyên chính trong thư mục `/assets/models/` (đối tượng 3D GLB) và `/assets/audio/` (tệp âm thanh .wav). Dưới đây là bảng kê khai chi tiết dựa trên phân tích cấu trúc tệp thực tế.

### 1. Characters & Animals (Nhân vật & Vật nuôi)
Các mô hình nhân vật và động vật được thiết kế theo phong cách Low-poly, tối ưu hóa đa giác (< 5,000 polygons).

| Tên Mô Hình | Loại | Định dạng | Polycount | Trạng thái Animation | Trạng thái Hoàn thiện |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `farmer.glb` | Nhân vật chính (Player) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `grandpa.glb` | NPC (Ông nội / Người hướng dẫn) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `merchant.glb` | NPC (Thương nhân mua bán) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `shepherd.glb` | NPC (Người chăn cừu) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `lumberjack.glb` | NPC (Tiều phu đốn củi) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `fisher.glb` | NPC (Ngư dân đánh cá) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `seedseller.glb` | NPC (Người bán hạt giống) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `deliveryboy.glb` | NPC (Nhân vật giao hàng) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `cow.glb` | Vật nuôi lớn (Bò sữa) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `horse.glb` | Vật nuôi lớn (Ngựa) | GLB nhị phân | Low-poly (<5k) | Có sẵn (Keyframe phi nước kiệu) | Hoàn thiện (Three.js source) |
| `sheep.glb` | Vật nuôi (Cừu) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `goat.glb` | Vật nuôi (Dê) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `pig.glb` | Vật nuôi (Heo/Lợn) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `dog.glb` | Động vật cảnh (Chó giữ nhà) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `cat.glb` | Động vật cảnh (Mèo bắt chuột) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `chicken.glb` | Gia cầm (Gà) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `duck.glb` | Gia cầm (Vịt) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có keyframe) | Hoàn thiện tĩnh (Khronos Group) |
| `goose.glb` | Gia cầm (Ngỗng) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `rabbit.glb` | Vật nuôi (Thỏ) | GLB nhị phân | Low-poly (<5k) | Tĩnh (Chưa có Rig/Keyframe) | Sẵn sàng cho Rigging |
| `flamingo.glb` | Chim cảnh (Hồng hạc) | GLB nhị phân | Low-poly (<2k) | Có sẵn (Keyframe bay đập cánh) | Hoàn thiện (Three.js source) |
| `fox.glb` | Động vật hoang dã (Cáo) | GLB nhị phân | Low-poly (<3k) | Có sẵn (Keyframe chạy nhảy) | Hoàn thiện (Khronos Group) |
| `drone.glb` | Thiết bị bay tự động | GLB nhị phân | Low-poly (<3k) | Hoạt cảnh tự sinh (Quay cánh quạt) | Hoàn thiện tự sinh |

### 2. Environment & Farm Buildings (Môi trường & Công trình)
Công trình xây dựng được thiết kế dạng mô-đun, sẵn sàng lắp ghép thành hệ thống nông trại hoàn chỉnh.

| Tên Mô Hình | Loại | Định dạng | Phương pháp dựng | Đặc tả kết cấu / Chi tiết PBR |
| :--- | :--- | :--- | :--- | :--- |
| `barn.glb` | Nhà kho nông trại lớn | GLB nhị phân | Lắp ghép (Procedural/Blender) | Khung đỏ, mái dốc đỏ sẫm, cổng gỗ vàng chữ X, viền trắng |
| `cowbarn.glb` | Chuồng bò sữa | GLB nhị phân | Lắp ghép (Procedural/Blender) | Rào chắn gỗ, khay cỏ ăn, máng nước, mái che tôn xám |
| `pigpen.glb` | Chuồng heo | GLB nhị phân | Lắp ghép (Procedural/Blender) | Hàng rào gỗ thấp, sàn bùn đất nâu, máng ăn gỗ |
| `chickencoop.glb`| Chuồng gà gia cầm | GLB nhị phân | Lắp ghép (Procedural/Blender) | Nhà gỗ nhỏ nâng cao chân, thang leo gỗ, ổ rơm lót trứng |
| `doghouse.glb` | Nhà cho chó | GLB nhị phân | Lắp ghép (Procedural/Blender) | Nhà gỗ mini mái đỏ, bát đựng thức ăn inox |
| `greenhouse.glb` | Nhà kính trồng rau | GLB nhị phân | Lắp ghép (Procedural/Blender) | Khung thép trắng, các tấm kính xanh bán trong suốt |
| `blacksmith.glb` | Lò rèn kim loại | GLB nhị phân | Lắp ghép (Procedural/Blender) | Bể chứa than cháy đỏ, đe rèn sắt, kệ trưng bày vũ khí |
| `kitchen.glb` | Nhà bếp / Chế biến | GLB nhị phân | Lắp ghép (Procedural/Blender) | Bếp lò đất nung, nồi gang lớn, bàn sơ chế nông sản |
| `toolshed.glb` | Nhà chứa dụng cụ | GLB nhị phân | Lắp ghép (Procedural/Blender) | Kệ treo cuốc, xẻng, cào đất, bình tưới nước |
| `tractorshed.glb`| Nhà xe máy cày | GLB nhị phân | Lắp ghép (Procedural/Blender) | Nhà xe mái cao rỗng ruột để đậu máy cày, hộp đựng dầu |
| `windmill.glb` | Cối xay gió phát điện | GLB nhị phân | Tự sinh (Procedural) | Đế đá bát giác 2 tầng, tháp trắng, ban công lan can bát giác, cửa gỗ tay nắm đồng, cánh quạt lattice quay |
| `waterwell.glb` / `well.glb` | Giếng nước | GLB nhị phân | Lắp ghép (Procedural/Blender) | Giếng đá tròn, ròng rọc thép, dây thừng quấn gàu gỗ |
| `waterpump.glb` | Bơm nước cơ học | GLB nhị phân | Lắp ghép (Procedural/Blender) | Trụ sắt sơn xanh, tay cầm gạt nước chuyển động lên xuống |
| `silo.glb` | Tháp ủ / Chứa ngũ cốc | GLB nhị phân | Lắp ghép (Procedural/Blender) | Trụ kim loại cao tròn, mái vòm bạc, thang leo sắt ngoài |
| `compostbin.glb`| Thùng ủ phân hữu cơ | GLB nhị phân | Lắp ghép (Procedural/Blender) | Thùng gỗ nan hở chứa lá mục và chất thải hữu cơ |
| `graintrough.glb`| Máng ăn ngũ cốc | GLB nhị phân | Lắp ghép (Procedural/Blender) | Máng gỗ dài hình chữ V chứa hạt ngô/lúa |
| `woodpile.glb` | Đống củi khô | GLB nhị phân | Lắp ghép (Procedural/Blender) | Các khúc củi trụ xếp chồng đan chéo lên nhau |
| `wheelbarrow.glb`| Xe cút kít | GLB nhị phân | Lắp ghép (Procedural/Blender) | Khung sắt đỏ, 1 bánh xe phía trước, thùng chứa đất |
| `scarecrow.glb` / `scarecrow_npc.glb` | Bù nhìn rơm | GLB nhị phân | Tự sinh (Procedural) | Đế gỗ chữ X, thân áo flannel vá chéo, thắt lưng thừng, rơm lổm chổm cổ tay/cổ áo, đầu bao cát mắt cúc |
| `tree.glb` | Cây thông rừng | GLB nhị phân | Tự sinh (Procedural) | Thân gỗ nâu nhạt, 3 tầng lá thông nón xoay đung đưa |

### 3. Crops (Cây trồng trong chậu Terracotta)
10 loại cây trồng nông nghiệp sinh hoàn toàn bằng **Procedural Generator** (`generate_models.js`), cấu hình sẵn các nhóm `sway_group` để đung đưa trước gió và hoạt cảnh nảy mầm `scale_group`.

1. `crop_carrot.glb` / `carrot.glb`: Củ màu cam nhô lên khỏi đất nhám, lá chùm răng cưa xanh đậm.
2. `crop_corn.glb` / `corn.glb`: Thân phân đoạn xanh, 6 lá cong chĩa ra, 2 bắp ngô vỏ mạ râu cam.
3. `crop_rice.glb` / `rice.glb`: Cụm thân mảnh chụm gốc xòe ngọn, các bông lúa hạt vàng trĩu nghiêng.
4. `crop_tomato.glb` / `tomato.glb`: Thân leo quấn khung gỗ chữ V, chùm lá xum xuê, quả chín đỏ và xanh treo rủ.
5. `sunflower.glb`: Thân cao thẳng, hai lá dẹt đối xứng, đầu hoa nhị nâu phẳng, vòng cánh hoa vàng rực.
6. `eggplant.glb`: Thân phân nhánh thấp màu xanh tím, quả giọt nước tím sẫm có cuống xanh to che đầu.
7. `pumpkin.glb`: Quả bí ngô lớn khía múi cam nằm đất, dây leo bò lượn quanh chậu, lá ngũ giác rộng.
8. `cabbage.glb`: Lá ngoài tròn dẹt xòe rộng xanh sẫm, lá cuộn trong ôm chặt thành khối cầu xanh nhạt.
9. `chili.glb`: Thân mảnh phân nhánh, lá thon dài, quả ớt nón cong nhỏ chín đỏ/xanh chĩa lên hoặc rủ xuống.
10. `strawberry.glb`: Bụi lá thấp ba chạc sát chậu, hoa nhỏ năm cánh trắng nhị vàng, quả dâu đỏ hạt vàng rủ quanh chậu.
11. `avocado.glb`: Quả bơ cắt đôi chứa hạt nâu tròn (Mô hình PBR cao cấp nặng 8.13 MB từ Khronos Group làm nông sản đặc biệt).

### 4. Vehicles (Phương tiện cơ giới)
| Tên Mô Hình | Loại | Định dạng | Hoạt cảnh Lập trình (Procedural JS) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| `tractor.glb` | Máy cày nông trại | GLB nhị phân | Bánh xe `wheel_` xoay trục X, khói xả `smoke_group` nảy | Hoàn thiện tự sinh |
| `harvester.glb` | Máy gặt đập liên hợp | GLB nhị phân | Trục gặt phía trước quay tròn, bánh xe xoay xả khói | Hoàn thiện tự sinh |
| `pickuptruck.glb`| Xe bán tải chở hàng | GLB nhị phân | Bánh xe quay, nắp thùng xe mở tải nông sản | Hoàn thiện tự sinh |

### 5. Audio Assets (Tài nguyên Âm thanh)
Hiện có 17 tệp âm thanh định dạng `.wav` chất lượng cao trong thư mục `assets/audio/`:

* **Nhạc nền & Môi trường**:
  * `bgm_relaxing.wav`: Nhạc nền Acoustic nhẹ nhàng lặp (looping) cho nông trại.
  * `birds.wav`: Tiếng chim hót líu lo tự nhiên.
  * `wind.wav`: Tiếng gió thổi nhẹ rì rào qua tán lá.
  * `water.wav` / `assets/audio/water.wav`: Tiếng nước chảy róc rách của con sông.
* **Hoạt động nông nghiệp (SFX)**:
  * `dig.wav`: Tiếng cuốc đất gieo hạt.
  * `seed.wav`: Tiếng rải hạt giống rơi xuống đất bùn.
  * `water_spray.wav`: Tiếng vòi phun nước, tưới nước cây trồng.
  * `harvest.wav`: Tiếng nhổ cây, thu hoạch nông sản bỏ giỏ.
  * `footstep_grass.wav`: Tiếng bước chân đi bộ trên cỏ xanh.
  * `footstep_dirt.wav`: Tiếng bước chân đi bộ trên đường đất.
* **Động vật kêu (SFX)**:
  * `chicken.wav`: Tiếng gà cục tác kêu.
  * `cow.wav`: Tiếng bò kêu "ụ bò" trầm ấm.
  * `sheep.wav`: Tiếng cừu kêu "be be".
* **Giao diện & Giải đố (UI/Puzzle SFX)**:
  * `click.wav`: Tiếng bấm nút giao diện nhẹ.
  * `correct.wav`: Tiếng chuông vang báo trả lời từ vựng tiếng Anh ĐÚNG.
  * `wrong.wav`: Tiếng còi buzzer báo trả lời từ vựng tiếng Anh SAI.
  * `victory.wav`: Nhạc ngắn chúc mừng chiến thắng, hoàn thành câu đố lớn/vượt cấp.

---

## PHẦN 2 — PHÂN TÍCH HỆ THỐNG MAP (MAP ANALYSIS)

Dự án phát triển dựa trên 2 cơ chế Map bổ trợ:
1. **Lưới Bản đồ Nông trại Mini (Tĩnh 8x8)**: Phục vụ cho giao diện Viewer demo lắp ghép nhanh.
2. **Hệ thống Infinite Procedural Terrain (Địa hình Vô tận)**: Triển khai trong các file `js/terrainSystem.js`, `js/chunkManager.js`, `js/meshBuilder.js` chạy đa luồng qua Web Workers (`js/terrainWorker.js`).

### 1. Phân tích Bản đồ Nông trại Tĩnh (Mini Farm Map)
* **Kích thước**: Lưới 8x8 ô gạch (mỗi ô rộng `0.95`, cao `0.2`).
* **Theme**: Đồng cỏ nông thôn thanh bình (Sunny Countryside).
* **Biome**: Cỏ xanh mướt mát, có sông nước cắt qua và cầu gỗ nối nhịp.
* **Cơ cấu ô gạch (Tile Layout)**:
  * `0`: Grass (Cỏ xanh - màu `0x78ab46`).
  * `1`: Path (Đường đi đất cát - màu `0xdfc49c`).
  * `2`: Soil (Đất cày xới trồng trọt - màu `0x8b5a2b`).
  * `3`: River (Sông nước chảy - màu `0x3388cc`, trong suốt 0.85).
  * `4`: Wood Bridge (Cầu gỗ bắc qua sông tại cột index 3).
* **Vị trí cố định (Static Landmarks)**:
  * Nhà kho đỏ (`barn.glb`): Đặt tại góc trên bên trái (Góc Tây Bắc).
  * Vành đai xanh: Bố trí ngẫu nhiên 8 cây thông (`tree.glb`) đung đưa viền xung quanh bản đồ.
  * Vật nuôi thả vườn: Tải ngẫu nhiên các mô hình vật nuôi chạy quanh các ô cỏ.

### 2. Phân tích Bản đồ Địa hình Vô tận (Infinite Procedural Terrain)
* **Kích thước**: Trượt vô hạn dựa trên cơ chế nạp/hủy chunk theo bán kính người chơi (Active Radius = 6 chunks, kích thước chunk = 256 đơn vị).
* **Đa luồng (Web Workers)**: `WorkerPool` quản lý 3 luồng song song gọi `terrainWorker.js` tính toán độ cao nhiễu (Simplex/Perlin noise) và trả về mảng float dữ liệu đỉnh.
* **Cơ chế LOD (Level of Detail)**:
  * LOD0 (Bán kính 0-1 chunk): Mật độ lưới cao nhất (64 segments).
  * LOD1 (Bán kính 2-3 chunks): Mật độ trung bình (32 segments).
  * LOD2 (Bán kính 4-6 chunks): Mật độ thấp tối ưu hiệu năng (16 segments).
* **Kỹ thuật Floating Origin (Trọng tâm Di động)**: Dịch chuyển toàn bộ tọa độ thế giới của camera và các mesh về gốc (0,0,0) khi khoảng cách di chuyển vượt ngưỡng `1000` đơn vị để tránh sai số dấu phẩy động (Single-precision floating-point artifacts) khi camera di chuyển quá xa.

### 3. Missing Components (Các thành phần đang thiếu trên Map)
* **Spawn Points**: Chưa cấu hình điểm xuất phát mặc định của nhân vật người chơi (`farmer.glb`).
* **NPC Locations**: Vị trí đứng của các NPC (`grandpa`, `merchant`, `seedseller`) chưa được neo cố định trên địa hình.
* **Quest Areas**: Các vùng khoanh để kích hoạt câu đố tiếng Anh (English learning gates).
* **Loot/Harvest Areas**: Phân vùng quy định ô đất nào có thể gieo hạt và thu hoạch.
* **Safe Zones**: Khu vực khuôn viên nhà chính bảo vệ cây trồng khỏi côn trùng/thú hoang (cáo phá).

### 4. Optimization Review (Đánh giá Tối ưu hóa)
* **Draw Calls Risk**: Việc nạp quá nhiều mô hình riêng lẻ (rào chắn, hoa cỏ, chậu cây) gây thắt nút cổ chai (bottleneck) lệnh vẽ. Giải pháp là ứng dụng kỹ thuật **`THREE.InstancedMesh`** đã được cấu trúc sẵn để render hàng loạt cây rừng và cỏ dại.
* **LOD Transition Pops**: Khi chuyển đổi LOD giữa các chunk, lưới địa hình có thể bị giật hình (pop-in). Cần bổ sung thuật toán nới rộng biên hoặc nội suy mượt Y ở biên.
* **Memory Leak**: Khi các chunk trôi ra ngoài bán kính hoạt động, cần đảm bảo gọi triệt để phương thức `dispose()` các cấu trúc hình học (Geometry) và chất liệu (Material). Hiện tại `meshBuilder.disposeMesh` và `unloadQueue` đã giải quyết cơ chế này qua `requestIdleCallback`.

---

## PHẦN 3 — SUY LUẬN GAME DESIGN (GAME DESIGN INFERENCE)

Dựa trên toàn bộ hệ thống mô hình 3D, âm thanh sẵn có và cấu trúc mã nguồn, chúng ta định nghĩa thiết kế trò chơi như sau:

### 1. Thể loại game (Genre)
**3D Low-Poly Cozy Farming Simulator combined with English Vocabulary Puzzle** (Game mô phỏng nông trại kết hợp giải đố từ vựng Tiếng Anh 3D).

### 2. Core Gameplay Loop (Vòng lặp Gameplay Cốt lõi)
```
  [ Khám Phá Địa Hình / Gặp gỡ NPC ]
                │
                ▼
  [ Nhận Câu Đố Tiếng Anh (Puzzle) ] ──(Trả lời sai: Mất năng lượng)
                │
        (Trả lời đúng)
                ▼
  [ Nhận Hạt Giống / Công Cụ / Vàng ]
                │
                ▼
  [ Gieo Hạt, Tưới Nước & Chăm Sóc ] ──(Hoạt cảnh Grow & Wind Sway)
                │
                ▼
  [ Thu Hoạch Nông Sản / Nuôi Thú ]
                │
                ▼
  [ Bán Sản Vật / Nâng Cấp Nông Trại ]
```

### 3. Secondary Loops (Vòng lặp Phụ)
* **Chăn nuôi (Animal Husbandry)**: Mua cỏ nuôi bò, cừu, dê, heo. Thu hoạch sữa bò, lông cừu, trứng gà đem bán.
* **Chế biến (Crafting/Kitchen)**: Đem lúa mì nghiền bột ở cối xay gió, nấu các món ăn tại nhà bếp (`kitchen.glb`) để bán được giá cao hơn hoặc tăng năng lượng.
* **Thương mại (Trading)**: Gặp NPC Thương nhân (`merchant.glb`) thương lượng giá cả sản phẩm nông nghiệp theo ngày để tối đa hóa lợi nhuận.
* **Nhiệm vụ cốt truyện (Questing with Grandpa)**: Trò chuyện với Ông nội (`grandpa.glb`) giải các câu đố tích hợp từ vựng tiếng Anh theo chủ đề để mở khóa các giống cây mới và công cụ cao cấp (Máy cày, thiết bị Drone).

---

## PHẦN 4 — PHÁT HIỆN THIẾU SÓT (GAP ANALYSIS)

Để xây dựng một trò chơi hoàn chỉnh từ hạ tầng Viewer 3D và tài nguyên hiện tại, các thiếu sót sau đây cần được phát triển (xếp theo độ ưu tiên từ P0 đến P2):

### 1. Critical Missing (Thiếu sót Chí mạng - P0)
* **Player Controller (Bộ điều khiển nhân vật)**: Code điều khiển nhân vật `farmer.glb` di chuyển trên địa hình (đi bộ, chạy) bằng phím WASD / JoyStick, kết nối hoạt cảnh chạy chân.
* **Terrain Height Query (Khớp độ cao)**: Hàm bắt tọa độ Y của nhân vật và NPC luôn nằm khớp trên bề mặt địa hình vô tận có độ cao nhấp nhô (đã quy hoạch giải thuật `getTerrainHeight(x, z)` cần tích hợp với nhân vật).
* **Farming Core System (Hệ thống nông nghiệp)**: Logic quản lý trạng thái của các ô đất trồng (Chưa cuốc -> Đã cuốc -> Đã gieo -> Cây lớn theo thời gian -> Chín -> Đã thu hoạch).
* **Inventory System (Túi đồ)**: Quản lý số lượng hạt giống, nông sản thu hoạch, dụng cụ và lượng tiền vàng (Gold) của người chơi.
* **English Puzzle Engine (Bộ máy giải đố)**: Hệ thống sinh câu đố từ vựng tiếng Anh ngẫu nhiên dưới dạng trắc nghiệm (Multiple Choice), điền vào chỗ trống hoặc ghép từ. Kích hoạt hiệu ứng âm thanh `correct.wav`/`wrong.wav`.

### 2. Important Missing (Thiếu sót Quan trọng - P1)
* **NPC AI & Dialog System (NPC & Đối thoại)**: Hộp thoại hiện chữ bong bóng khi người chơi tiếp cận NPC (`grandpa`, `seedseller`), hiển thị danh mục mua bán hạt giống.
* **Animal AI (Trí tuệ nhân vật động vật)**: Logic di chuyển ngẫu nhiên (Wander) cho các con thú (bò, cừu, gà) trong phạm vi nông trại, phát âm thanh kêu cách quãng qua `THREE.PositionalAudio`.
* **Save/Load System (Lưu trữ)**: Sử dụng `localStorage` lưu trữ trạng thái nông trại (vị trí người chơi, cấp độ từ vựng tiếng Anh đã học, cấu trúc các ô đất và túi đồ).
* **Audio Manager (Quản lý âm thanh)**: Điều phối nhạc nền (BGM) lặp vô tận và phát các âm thanh tương tác (SFX) tương ứng với hành động cuốc, tưới nước, gieo hạt.

### 3. Optional (Thiếu sót Mở rộng - P2)
* **Day/Night Cycle Gameplay Affect (Thời gian thực tế)**: Ban đêm thú hoang (Cáo) xuất hiện bắt gà con, người chơi phải trang bị bù nhìn rơm để xua đuổi.
* **Vocabulary Dictionary (Sổ tay từ vựng)**: Giao diện xem lại các từ vựng tiếng Anh đã học và phát âm chuẩn.
* **Achievements (Thành tựu)**: Danh hiệu cho "Lão nông học giỏi", "Vua tiếng Anh nông trại".

---

## PHẦN 5 — KIẾN TRÚC GAME ĐỀ XUẤT (GAME ARCHITECTURE)

Hệ thống sẽ được tổ chức dưới dạng các Module Javascript thuần (ES Modules), tải động qua index.html, đảm bảo tính mô-đun hóa cao và dễ bảo trì:

```
GAMENONGTRAIV3/
├── js/
│   ├── main.js                  # Điểm khởi chạy trò chơi, quản lý vòng lặp chính
│   ├── terrainSystem.js         # Hệ thống địa hình vô tận (Đang có)
│   ├── chunkManager.js          # Stream chunk địa hình (Đang có)
│   ├── meshBuilder.js           # Xây dựng lưới địa hình (Đang có)
│   ├── workerPool.js            # Quản lý Web Workers (Đang có)
│   ├── terrainWorker.js         # Tính toán nhiễu địa hình (Đang có)
│   ├── inputController.js       # Điều khiển camera tự do (Đang có)
│   │
│   ├── core/
│   │   ├── gameManager.js       # Quản lý trạng thái Game (State Machine: Loading, Menu, Playing, Puzzle)
│   │   ├── audioManager.js      # Quản lý phát BGM & SFX theo ngữ cảnh
│   │   └── saveSystem.js        # Lưu/Tải dữ liệu bằng LocalStorage
│   │
│   ├── player/
│   │   ├── playerController.js  # Nhận phím WASD, di chuyển Farmer, kiểm tra va chạm địa hình
│   │   └── animator.js          # Điều khiển hoạt cảnh mixer của mô hình farmer.glb
│   │
│   ├── farming/
│   │   ├── farmManager.js       # Quản lý danh sách các ô đất trồng trọt
│   │   ├── cropController.js    # Điều khiển sự lớn lên (Scale) và đung đưa (Sway) của cây trồng
│   │   └── animalAI.js          # Trí tuệ nhân vật động vật đi lang thang
│   │
│   ├── inventory/
│   │   └── inventory.js         # Lưu trữ hạt giống, nông sản, tiền vàng
│   │
│   ├── puzzle/
│   │   ├── puzzleEngine.js      # Logic sinh câu hỏi tiếng Anh, kiểm tra đáp án
│   │   └── wordDatabase.js      # Cơ sở dữ liệu từ vựng theo chủ đề (đồ dùng, động vật, nông nghiệp)
│   │
│   └── ui/
│       ├── uiManager.js         # Điều khiển hiển thị HUD, túi đồ, cửa sổ hội thoại, bảng câu đố
│       └── components.js        # Định nghĩa các phần tử DOM UI động
```

### Chi tiết các Module chính:
* **GameManager**: Trình điều phối cao nhất, chuyển đổi giữa chế độ nông trại bình thường (Exploration/Farming) và chế độ làm bài tập tiếng Anh (Puzzle Mode).
* **PlayerController**: Truy vấn vị trí X, Z hiện tại của người chơi trên lưới địa hình vô hạn, gọi hàm tìm độ cao Y tương ứng để giữ nhân vật bám sát mặt đất nhấp nhô.
* **FarmManager**: Quản lý tọa độ thế giới của các ô đất trồng. Khi người chơi đứng gần ô đất cày xới (`soil`) và ấn phím hành động, sẽ thực hiện gieo hạt hoặc tưới nước.
* **PuzzleEngine**: Khi tiếp cận các NPC hoặc công trình cần mở khóa (ví dụ: cối xay gió), một bảng câu đố tiếng Anh hiện ra. Người chơi chọn đúng sẽ được thưởng tài nguyên, chọn sai sẽ tiêu hao năng lượng.

---

## PHẦN 6 — CHIA NHỎ TASK PHÁT TRIỂN (TASK BREAKDOWN)

Mỗi task được thiết kế để có thể hoàn thành trong vòng **≤ 1 ngày làm việc**, có đầu vào/đầu ra rõ ràng và có thể kiểm thử độc lập.

### Epic: Player & Camera
#### Task 1: Tích hợp mô hình Farmer vào Scene địa hình
* **Đầu vào**: Tệp `assets/models/farmer.glb`.
* **Đầu ra**: Mô hình xuất hiện tại vị trí Spawn trên địa hình.
* **Kiểm thử**: Mô hình hiển thị đúng chất liệu, đúng tỉ lệ so với môi trường.
* **Subtasks**:
  * Tải mô hình bằng `GLTFLoader`.
  * Đặt vị trí ban đầu tại tọa độ (0, Y_terrain, 0).
  * Điều chỉnh camera hướng về phía Farmer.

#### Task 2: Cài đặt Player Controller (Movement & Gravity)
* **Đầu vào**: Phím bấm WASD / Phím mũi tên từ bàn phím.
* **Đầu ra**: Vị trí Farmer thay đổi theo hướng bấm phím, Y luôn bám sát bề mặt địa hình.
* **Kiểm thử**: Điều khiển nhân vật chạy lên đồi và xuống thung lũng không bị bay lơ lửng hay lún dưới đất.
* **Subtasks**:
  * Bắt sự kiện phím bấm `keydown`/`keyup`.
  * Tính toán vector di chuyển dựa trên hướng camera hiện tại.
  * Truy vấn độ cao địa hình tại tọa độ (X, Z) mới và cập nhật tọa độ Y của Farmer.

#### Task 3: Tích hợp hoạt cảnh di chuyển (Mixer Animations)
* **Đầu vào**: Vận tốc di chuyển của Farmer và các Clip hoạt cảnh nhúng trong GLB.
* **Đầu ra**: Phát hoạt cảnh `Walk`/`Run` khi di chuyển và `Idle` khi đứng yên.
* **Kiểm thử**: Nhân vật chuyển động chân tay nhịp nhàng đồng bộ với tốc độ di chuyển trên màn hình.

---

### Epic: Farming Core System
#### Task 4: Tạo hệ thống lưới ô đất trồng trọt (Plot System)
* **Đầu vào**: Tọa độ bấm chuột trên địa hình.
* **Đầu ra**: Xác định ô đất đang ngắm tới có thể cuốc hay không.
* **Kiểm thử**: Click vào cỏ không có tác dụng, click vào vùng đất cày xới kích hoạt vùng canh tác.
* **Subtasks**:
  * Raycast từ camera tìm giao điểm của chuột với lưới đất.
  * Đánh dấu và đổi màu hiển thị ô đất được chọn (Highlight grid box).

#### Task 5: Thực hiện hoạt động Cuốc đất & Gieo hạt
* **Đầu vào**: Chọn hạt giống trong túi đồ, nhấn nút hành động (E hoặc Click).
* **Đầu ra**: Thay đổi trạng thái ô đất, kích hoạt âm thanh `dig.wav`/`seed.wav`.
* **Kiểm thử**: Ô đất chuyển sang trạng thái "Đang gieo hạt", hiển thị mầm cây nhỏ bé ở tỉ lệ scale `0.01`.

#### Task 6: Tăng trưởng cây trồng thời gian thực (Crop Growth)
* **Đầu vào**: Lượng thời gian trôi qua (delta time), trạng thái ô đất được tưới nước.
* **Đầu ra**: Mô hình cây trồng (`crop_tomato.glb`, v.v.) tăng kích thước theo 3 giai đoạn (Mầm -> Cây con -> Cây chín).
* **Kiểm thử**: Cây lớn dần sau mỗi 10 giây nếu được tưới nước, đổi mô hình quả xanh sang quả đỏ khi chín.
* **Subtasks**:
  * Áp dụng hoạt cảnh `scale_group` từ `0.01` đến `1.0`.
  * Đăng ký cụm lá quả vào hệ thống `sway_group` để tự động đung đưa trước gió.

---

### Epic: English Puzzle Engine
#### Task 7: Thiết lập cơ sở dữ liệu từ vựng (Vocabulary Database)
* **Đầu vào**: Danh sách từ vựng tiếng Anh chủ đề Nông nghiệp, Động vật, Đồ vật.
* **Đầu ra**: Tệp `js/puzzle/wordDatabase.js` xuất ra cấu trúc mảng câu hỏi (Từ tiếng Anh, Nghĩa tiếng Việt, Gợi ý, Tệp âm thanh từ vựng).
* **Kiểm thử**: Đọc thành công dữ liệu từ vựng trong code.

#### Task 8: Giao diện bảng câu đố (Puzzle UI Overlay)
* **Đầu vào**: Kích hoạt sự kiện gặp NPC.
* **Đầu ra**: Bảng HTML/CSS phủ lên canvas 3D hiển thị câu hỏi và 4 đáp án lựa chọn.
* **Kiểm thử**: Giao diện hiển thị đẹp, responsive trên màn hình và không làm đơ game 3D phía sau.

#### Task 9: Logic kiểm tra đáp án và Trả thưởng
* **Đầu vào**: Click vào 1 trong 4 đáp án.
* **Đầu ra**:
  * Trả lời ĐÚNG: Phát tiếng `correct.wav`, cộng vàng/hạt giống, đóng bảng.
  * Trả lời SAI: Phát tiếng `wrong.wav`, trừ năng lượng người chơi, rung màn hình báo lỗi.
* **Kiểm thử**: Trả lời đúng/sai cập nhật chính xác số lượng tài nguyên hiển thị trên thanh HUD.

---

## PHẦN 7 — ROADMAP PHÁT TRIỂN (DEVELOPMENT ROADMAP)

### Giai đoạn 1: Prototype (Tuần 1 - Nền tảng Kỹ thuật)
* **Mục tiêu**: Thiết lập bộ khung trò chơi, kết nối camera theo sau nhân vật chính trên địa hình vô hạn.
* **Các thành phần hoàn thiện**:
  * Tải thành công mô hình `farmer.glb` và di chuyển bám địa hình.
  * Tích hợp hệ thống Camera Orbital thông minh theo sau lưng Farmer.
  * Tối ưu hóa Web Workers tải chunk địa hình vô hạn không gây giật lag (Micro-stuttering).

### Giai đoạn 2: Core Gameplay (Tuần 2 - Cơ chế trồng trọt & Nuôi thú)
* **Mục tiêu**: Xây dựng hoàn chỉnh chu trình trồng trọt nông nghiệp và chăn nuôi cơ bản.
* **Các thành phần hoàn thiện**:
  * Cơ chế cuốc đất, gieo hạt, tưới nước bằng bình tưới nước.
  * Hoạt cảnh đung đưa trước gió của 10 giống cây trồng và cây thông xung quanh.
  * Động vật đi lang thang (Bò, Cừu, Gà) phát âm thanh định vị 3D khi lại gần.

### Giai đoạn 3: English Puzzle Integration (Tuần 3 - Tích hợp giải đố từ vựng)
* **Mục tiêu**: Lồng ghép hệ thống học tiếng Anh vào dòng chảy game.
* **Các thành phần hoàn thiện**:
  * Hệ thống NPC tương tác mở bảng câu đố tiếng Anh.
  * Cơ sở dữ liệu 500 từ vựng chia theo cấp độ khó và chủ đề nông trại.
  * Âm thanh phản hồi trực quan (Correct/Wrong/Victory) kích hoạt tức thì.

### Giai đoạn 4: Alpha (Tuần 4 - Khép kín Vòng lặp Loop)
* **Mục tiêu**: Chạy thử nghiệm toàn bộ game, khép kín vòng lặp từ khám phá -> làm câu đố -> lấy hạt giống -> trồng trọt -> bán sản vật lấy tiền vàng mua máy cày.
* **Các thành phần hoàn thiện**:
  * Hệ thống lưu trữ dữ liệu chơi game `localStorage`.
  * Cửa hàng hạt giống (NPC Seedseller) và cửa hàng bán nông sản (NPC Merchant).
  * Tối ưu hóa giao diện HUD (Thanh năng lượng, Số tiền, Túi đồ chứa nông sản).

### Giai đoạn 5: Beta (Tuần 5 - Tối ưu hóa & Cân bằng game)
* **Mục tiêu**: Tăng tốc độ khung hình đạt ổn định 60 FPS trên thiết bị di động, sửa lỗi bộ nhớ.
* **Các thành phần hoàn thiện**:
  * Tối ưu hóa Draw Calls bằng cách gộp nhóm vật thể tĩnh qua `THREE.InstancedMesh` (hàng rào, cỏ hoa).
  * Dọn dẹp rác bộ nhớ (Memory Dispose) khi chuyển đổi vùng bản đồ.
  * Cân bằng kinh tế trong game (giá hạt giống, thời gian cây chín, phần thưởng vàng).

### Giai đoạn 6: Release (Tuần 6 - Đóng gói & Phát hành)
* **Mục tiêu**: Trò chơi sẵn sàng vận hành ổn định trên Web.
* **Các thành phần hoàn thiện**:
  * Tích hợp nút xuất mô hình nông trại hoàn chỉnh ra file `.glb` để người chơi lưu trữ/chia sẻ công trình của mình.
  * Triển khai tĩnh (Static hosting) dự án lên GitHub Pages hoặc Vercel.

---

## PHẦN 8 — ƯỚC TÍNH KHỐI LƯỢNG (ESTIMATION & RISK ANALYSIS)

| Hệ thống | Độ khó | Thời gian dự kiến | Rủi ro chí mạng | Giải pháp giảm thiểu | Phụ thuộc (Dependencies) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Player Controller & Gravity**| Trung bình | 2 ngày | Nhân vật bị rơi xuyên qua địa hình khi chunk đang tải | Khóa di chuyển của nhân vật cho đến khi chunk đứng dưới chân tải xong | `meshBuilder.js` |
| **Infinite Chunk Streaming** | Khó | 3 ngày | Giật FPS (Lag spikes) khi tải chunk mới thời gian thực | Sử dụng Web Workers xử lý luồng phụ (Đã có cấu trúc `WorkerPool`) | `terrainWorker.js` |
| **Farming Plots System** | Dễ | 2 ngày | Sai lệch tọa độ nhấp chuột trên địa hình nghiêng | Sử dụng Raycasting chiếu thẳng trục xuống mặt phẳng lưới đất | `inputController.js` |
| **English Puzzle Module** | Dễ | 1 ngày | UI chen lấn canvas 3D gây lỗi hiển thị trên màn hình dọc | Thiết kế CSS Flexbox/Grid chuẩn Responsive di động | Giao diện HTML/CSS |
| **Audio Manager** | Dễ | 1 ngày | Trình duyệt chặn tự động phát âm thanh (Autoplay policy) | Chỉ khởi tạo Audio Context sau click chuột đầu tiên của người dùng | `assets/audio/` |
| **Save/Load State System** | Dễ | 1 ngày | Lỗi định dạng JSON khi dữ liệu lưu trữ bị hỏng | Bọc hàm phân tích cú pháp trong khối `try-catch`, cung cấp cơ chế reset | `localStorage` |

---

## PHẦN 9 — KẾ HOẠCH ƯU TIÊN TRIỂN KHAI (PRIORITIZATION PLAN)

Chúng tôi sắp xếp thứ tự các công việc phát triển theo trình tự tối ưu nhất để tránh tình trạng tắc nghẽn (bottleneck) kỹ thuật:

1. **[P0] Trọng tâm 1**: Hoàn thiện Player di chuyển trên địa hình vô hạn (kết nối `farmer.glb` + hệ thống bắt Y địa hình).
2. **[P0] Trọng tâm 2**: Xây dựng hệ thống ô đất canh tác (Plot) và logic trồng trọt cơ bản (Gieo hạt -> Cây lớn đung đưa gió -> Thu hoạch).
3. **[P0] Trọng tâm 3**: Triển khai Puzzle Engine (giao diện câu đố từ vựng tiếng Anh trắc nghiệm, phản hồi đúng/sai kèm âm thanh).
4. **[P1] Trọng tâm 4**: Phát triển hệ thống túi đồ (Inventory) lưu trữ tài sản, tiền vàng và hạt giống.
5. **[P1] Trọng tâm 5**: Tạo lập các NPC thương mại và hội thoại (Nhiệm vụ hướng dẫn học tiếng Anh).
6. **[P1] Trọng tâm 6**: Tích hợp Audio Manager điều phối âm thanh nông trại và tiếng động vật kêu định vị 3D.
7. **[P2] Trọng tâm 7**: Lưu trữ game, hoàn thiện HUD, chu kỳ ngày/đêm và tối ưu hóa hiệu năng thiết bị di động.

---

## PHẦN 10 — HÀNH ĐỘNG TIẾP THEO (NEXT ACTIONS - 30 TASKS)

Dưới đây là 30 nhiệm vụ cụ thể có thể thực hiện ngay từ trạng thái hiện tại (chỉ có Asset và Map, chưa có code gameplay):

### Setup & Architecture
1. [ ] Tạo file thư mục cấu trúc `js/core/gameManager.js` quản lý máy trạng thái trò chơi (State Machine).
2. [ ] Tạo file `js/player/playerController.js` nhận sự kiện bàn phím WASD điều khiển di chuyển.
3. [ ] Viết hàm tính độ cao địa hình chính xác `getTerrainHeight(x, z)` từ dữ liệu chunk địa hình vô hạn để nhân vật bám đất.
4. [ ] Tạo file `js/farming/farmManager.js` để lưu trữ trạng thái các ô đất trồng trên thế giới.
5. [ ] Tạo file `js/inventory/inventory.js` định nghĩa class quản lý vật phẩm và tiền vàng.
6. [ ] Tạo file `js/puzzle/puzzleEngine.js` chứa logic sinh câu hỏi và so sánh đáp án từ vựng.
7. [ ] Tạo file `js/puzzle/wordDatabase.js` lưu trữ 100 từ vựng tiếng Anh nông nghiệp ban đầu.
8. [ ] Tạo file `js/core/audioManager.js` khởi tạo Web Audio Context phục vụ quản lý nhạc nền và hiệu ứng.

### Player & Camera Integration
9. [ ] Nạp mô hình `assets/models/farmer.glb` bằng `GLTFLoader` vào scene của `terrainSystem.js`.
10. [ ] Điều chỉnh vị trí Pivot của Farmer chạm đáy chân để việc tính Y bám đất chính xác 100%.
11. [ ] Sửa đổi `js/inputController.js` để camera tự động bám đuổi theo tọa độ di chuyển của nhân vật thay vì drift tự do.
12. [ ] Thiết lập bộ kiểm soát hoạt cảnh `THREE.AnimationMixer` cho nhân vật để chuyển trạng thái đứng yên sang chạy bộ.

### Farming Mechanics
13. [ ] Tạo cơ chế highlight ô đất khi nhân vật đứng gần và nhìn vào (giúp người chơi định vị mục tiêu tương tác).
14. [ ] Viết logic chuyển đổi trạng thái ô cỏ (`grass`) thành ô đất trồng (`soil`) khi người chơi sử dụng công cụ cuốc đất.
15. [ ] Tích hợp âm thanh `dig.wav` khi thực hiện hành động cuốc đất thành công.
16. [ ] Cài đặt chức năng gieo hạt: Trừ hạt giống trong túi đồ, đặt mô hình cây tương ứng (ví dụ: `crop_carrot.glb`) vào tâm ô đất.
17. [ ] Tích hợp âm thanh `seed.wav` khi gieo hạt trồng cây thành công.
18. [ ] Viết bộ đếm thời gian (Timer) cập nhật mức độ lớn lên của cây từ mầm non (scale 0.01) đến chín (scale 1.0).
19. [ ] Đăng ký các nhánh lá của mô hình cây trồng mới vào mảng đung đưa gió `sway_group` của viewer.
20. [ ] Viết logic thu hoạch nông sản khi cây chín: Xóa mô hình cây, cộng nông sản tương ứng vào túi đồ, phát âm thanh `harvest.wav`.

### NPC & Puzzle Interactions
21. [ ] Nạp mô hình NPC Ông nội `assets/models/grandpa.glb` đặt tại khu vực cố định gần điểm xuất phát.
22. [ ] Nạp mô hình NPC Cửa hàng hạt giống `assets/models/seedseller.glb` đặt bên cạnh quầy hàng.
23. [ ] Tạo hiệu ứng tương tác: Khi người chơi đến gần NPC trong khoảng cách 3 đơn vị, hiển thị biểu tượng nút "Nói chuyện (E)".
24. [ ] Viết giao diện bảng câu đố từ vựng tiếng Anh (giao diện HTML phủ lên màn hình game) với các nút chọn đáp án A, B, C, D.
25. [ ] Kết nối sự kiện click đáp án: Trả lời ĐÚNG phát tiếng `correct.wav` và cộng 10 vàng cho người chơi.
26. [ ] Kết nối sự kiện click đáp án: Trả lời SAI phát tiếng `wrong.wav` và trừ 5 năng lượng (Energy) của người chơi.

### Audio & Atmosphere
27. [ ] Cấu hình nhạc nền `bgm_relaxing.wav` chạy lặp vô tận (loop) ngay sau khi người chơi tương tác bấm nút bắt đầu game.
28. [ ] Thêm âm thanh gió thổi `wind.wav` và chim hót `birds.wav` phát ngẫu nhiên cách quãng tạo không khí đồng quê.
29. [ ] Gắn nguồn phát âm thanh `water.wav` định vị 3D tại tọa độ chảy của con sông để nghe thấy tiếng nước chảy to dần khi lại gần sông.

### Serialization & Save State
30. [ ] Viết hàm lưu trạng thái trò chơi (Tọa độ người chơi, số vàng, số hạt giống, trạng thái các ô đất) thành chuỗi JSON lưu vào `localStorage` mỗi 30 giây.

---

## PHẦN 11 — KẾ HOẠCH TRIỂN KHAI CHƯƠNG 2: TƯƠNG TÁC NÂNG CAO & MÔI TRƯỜNG GAME

Chương 2 tập trung vào việc hoàn thiện cấu trúc tương tác trong game, bao gồm nạp và căn chỉnh tỷ lệ các mô hình tĩnh đặc thù, liên kết toàn bộ bảng điều khiển cấu hình (settings overlay), hoàn thành cơ chế kích hoạt hội thoại NPC qua raycasting chuột, và chuẩn hóa bố cục giao diện người dùng (UI).

### 1. Cấu hình Mô hình & Điểm xuất hiện (Model & Spawning)
*   **Mô hình bổ sung**: `compostbin` và `waterpump`.
*   **Ánh xạ Tỷ lệ (Scale Mapping)**: Điều chỉnh tỷ lệ lên `15.0` (trong `AssetPresenter.js`) để đảm bảo hiển thị cân đối trên địa hình.
*   **Tọa độ Spawn**:
    *   `compostbin`: Tọa độ `(15, height, -25)`
    *   `waterpump`: Tọa độ `(-15, height, -28)`
    *   *Lưu ý*: Độ cao `height` của cả hai mô hình phải được tính toán tự động qua hàm `getTerrainHeight(x, z)` tại thời điểm nạp để tránh lơ lửng hoặc lún sâu.

### 2. Sự kiện & Liên kết Bảng điều khiển Cấu hình (Settings Wiring)
*   **Thời thời tiết (`#settings-select-weather`)**: Thay đổi kiểu thời tiết thông qua `terrainSystem.setWeather(mode)` (Rain, Fog, Snow, Clear).
*   **Thời gian (`#settings-select-time`)**: Thay đổi thời gian trong ngày qua `terrainSystem.setTimeOfDay(time)` (Day, Night, Dawn, Dusk).
*   **Tắt/Mở âm thanh (`#btn-toggle-sound`)**:
    *   Gọi phương thức `soundSystem.toggleMute()`.
    *   Cập nhật trạng thái text nút động hiển thị "Mute Sound" hoặc "Unmute Sound".
*   **Điều khiển Cổng nông trại (`#settings-btn-toggle-gate`)**:
    *   Gọi `terrainSystem.toggleGate()`.
    *   Cập nhật nhãn nút hiển thị trạng thái hiện tại của cổng: "Open (Mở)" hoặc "Closed (Đóng)".
*   **Đặt lại Camera (`#settings-btn-reset-pos`)**:
    *   Đặt lại vị trí camera: `camera.position.set(0, 150, 250)`.
    *   Đặt lại điểm ngắm (target): `controls.target.set(0, 0, 0)`.

### 3. Cơ chế Raycasting Click chuột & Cửa hàng NPC (Shop Triggers)
*   Thực hiện Raycasting phát hiện va chạm chuột với các mô hình 3D của NPC hoặc công trình cửa hàng (`npc_seedseller`, `npc_merchant`, `building_barn`).
*   Khi click vào mô hình `npc_seedseller` (hoặc các NPC cửa hàng khác):
    *   Chuyển tab của Cozy Farm panel sang tab Cửa hàng (`shop`) bằng cách kích hoạt `switchTab('shop')`.
    *   Tự động mở rộng Cozy Farm panel nếu đang thu gọn (loại bỏ class `collapsed` khỏi phần tử `#sidebar-panel`).

### 4. Dọn dẹp & Chuẩn hóa Giao diện (UI Layout Polish)
*   **Loại bỏ nút dư thừa**: Loại bỏ toàn bộ các nút kích hoạt hamburger menu lỗi thời hoặc trùng lặp chức năng điều khiển sidebar.
*   **Thanh Kỹ năng (Farming Skills Bar)**:
    *   Đảm bảo container `.skills-wheel-container` hiển thị hoàn toàn theo chiều ngang (horizontal layout).
    *   Căn chỉnh chính giữa ở góc dưới của khung nhìn canvas.
*   **Tái cấu trúc bảng điều khiển Cozy Farm**:
    *   Chuyển đổi giao diện từ thanh bên trượt (slide-out sidebar) thành một bảng vuông modal hiển thị căn giữa màn hình (kích thước `500px` x `500px` với tỉ lệ `1:1`).
    *   Tích hợp nút đóng thủ công (`#sidebar-close-btn` - hình ❌) ở phần tiêu đề để thu gọn bảng.
    *   Thêm cơ chế tự động ẩn bảng Cozy Farm khi người chơi tab ra ngoài hoặc thay đổi tab trình duyệt (thông qua sự kiện `visibilitychange` và `blur`).

### 5. Danh sách Nhiệm vụ Chi tiết Chương 2 (Chapter 2 Action Tasks)
31. [ ] Cấu hình nạp trước (preload) hai mô hình `compostbin` và `waterpump` trong file `js/main.js`.
32. [ ] Thiết lập tỷ lệ scale mặc định `15.0` cho `compostbin` và `waterpump` trong cấu hình ánh xạ của `AssetPresenter.js`.
33. [ ] Cài đặt logic tính toán độ cao bám đất và spawn hai thực thể `compostbin` và `waterpump` tại tọa độ thiết kế.
34. [ ] Viết/Kiểm tra hàm `toggleMute()` trong `SoundSystem.js` để bật/tắt toàn bộ âm thanh (Master Gain) và trả về trạng thái hiện tại.
35. [ ] Đăng ký sự kiện thay đổi (`change`) cho ô chọn thời tiết và thời gian trong ngày để điều khiển hệ thống thời tiết và ánh sáng môi trường của `terrainSystem`.
36. [ ] Đăng ký sự kiện click cho nút bật/tắt âm thanh, gọi `soundSystem.toggleMute()` và cập nhật giao diện nút tương ứng.
37. [ ] Đăng ký sự kiện click cho nút đóng/mở cổng nông trại, gọi `terrainSystem.toggleGate()` và cập nhật nhãn trạng thái cổng.
38. [ ] Đăng ký sự kiện click cho nút reset vị trí camera, khôi phục camera về tọa độ `(0, 150, 250)` và `controls.target` về `(0, 0, 0)`.
39. [ ] Cải tiến bộ kiểm tra click chuột Raycaster trong `js/main.js` để phát hiện nhấp chuột vào NPC seedseller.
40. [ ] Viết mã liên kết: khi click trúng NPC seedseller, tự động chuyển tab sidebar sang "shop" và loại bỏ class `collapsed` của `#sidebar-panel`.
41. [ ] Kiểm tra và loại bỏ các thẻ nút hamburger hoặc code JS toggler sidebar dư thừa trong `index.html`.
42. [ ] Sửa lại CSS của `.skills-wheel-container` và các phần tử con để dàn hàng ngang và căn giữa chính xác dưới đáy màn hình.
