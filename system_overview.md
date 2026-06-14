# TỔNG QUAN HỆ THỐNG GAME NÔNG TRẠI V3 (SYSTEM OVERVIEW)

Tài liệu này cung cấp một cái nhìn toàn diện về kiến trúc, thành phần, cấu trúc thư mục, danh sách mô hình 3D, cơ chế hoạt cảnh, đường ống sinh tài nguyên tự động và bộ xuất GLB của hệ thống **Game Nông Trại V3**.

---

## 1. Tổng quan Công nghệ & Kiến trúc (Technology & Architecture Overview)

Hệ thống được thiết kế theo mô hình **Client-Side Heavy, Lightweight Pipeline** với hai thành phần chính:
1. **Ứng dụng Viewer 3D (Trình xem mô hình)**: Chạy hoàn toàn trên trình duyệt của người dùng (Client-side), sử dụng HTML5, CSS3 và Javascript thuần (Vanilla JS). Hệ thống không dùng các công cụ build (như Webpack, Vite) hay trình quản lý gói npm ở phía client. Toàn bộ thư viện được nạp thông qua các mạng phân phối nội dung (CDN).
2. **Đường ống Sinh mô hình Tự động (Procedural Generation CLI)**: Chạy trên môi trường Node.js (Server-side/CLI), thực hiện sinh các mô hình 3D low-poly từ các khối hình học cơ bản (Primitives) và xuất ra các tệp `.glb` nhị phân lưu trữ tĩnh trong thư mục `assets/models/`.

### Các Thư viện & CDN Cốt lõi:
*   **Three.js (r128)**: Thư viện đồ họa 3D chính để hiển thị Scene, Camera, Lights, Geometries, Materials và Renderer.
*   **OrbitControls**: Điều khiển camera tương tác (xoay, thu phóng, di chuyển).
*   **GLTFLoader**: Tải động các mô hình 3D định dạng `.glb` từ máy chủ.
*   **GLTFExporter**: Trích xuất và đóng gói cảnh 3D hiện tại hoặc mô hình đơn lẻ thành tệp nhị phân `.glb` tải về máy khách.

### Hệ thống Trực quan & Môi trường 3D:
*   **Ánh sáng (Lights)**:
    *   *Ambient Light (Ánh sáng môi trường)*: Cung cấp độ sáng cơ bản (cường độ `0.65`) để không có vùng nào bị tối đen hoàn toàn.
    *   *Directional Light (Ánh sáng mặt trời)*: Tạo bóng đổ (cường độ `0.85`), cấu hình bản đồ bóng đổ PCFSoftShadowMap độ phân giải 2048x2048 bao phủ vùng lưới địa hình.
    *   *Hemisphere Light (Ánh sáng bầu trời)*: Mô phỏng ánh sáng phản xạ từ mặt đất lên mặt dưới của vật thể (cường độ `0.35`).
*   **Sương mù (Fog)**: Sử dụng sương mù mũ rộng `THREE.FogExp2` với màu tối (`0x1a1c1e`) và mật độ sương `0.015` tạo chiều sâu không gian cảnh quan.
*   **Lưới tọa độ & Sàn bóng đổ (Helpers & Ground)**:
    *   *GridHelper*: Lưới tọa độ kích thước 20x20 phân vùng không gian.
    *   *ShadowFloor (Mesh phẳng nhận bóng)*: Nhận bóng đổ động từ các mô hình mà không hiển thị chất liệu nền (ShadowMaterial có độ mờ `0.18`).

---

## 2. Cấu trúc Thư mục Dự án (Project Directory Structure)

```
GAMENONGTRAIV3/
│
├── assets/
│   └── models/               # Chứa các tệp mô hình 3D (.glb) tĩnh và tự động sinh
│       ├── duck.glb          # Con vịt vàng (Vật nuôi) - Nguồn: Khronos Group
│       ├── avocado.glb       # Quả bơ cắt đôi (Nông sản) - Nguồn: Khronos Group
│       ├── horse.glb         # Chú ngựa nâu đang phi (Vật nuôi lớn) - Nguồn: Three.js
│       ├── flamingo.glb      # Chim hồng hạc bay (Chim cảnh) - Nguồn: Three.js
│       ├── fox.glb           # Chú cáo nhỏ (Động vật hoang dã) - Nguồn: Khronos Group
│       ├── tractor.glb       # Máy cày nông trại (Mô hình sinh tự động)
│       ├── tree.glb          # Cây thông rừng (Mô hình sinh tự động)
│       └── [các mô hình khác] # Được sinh tự động từ script generate_models.js
│
├── js/
│   └── viewer.js             # Mã nguồn chính thiết lập cảnh Three.js và tương tác UI ở Client
│
├── index.html                # Cấu trúc giao diện ứng dụng, nạp thư viện CDN và khởi chạy viewer.js
├── style.css                 # Định dạng CSS hiện đại, phẳng, tối ưu hóa giao diện nông trại
│
├── rules.md                  # Quy định bắt buộc về kỹ thuật, đồ họa và mô hình tự sinh
├── path_notes.md             # Nhật ký lưu trữ nguồn gốc mô hình và liên kết CDN
├── model_movement_plan.md    # Kế hoạch chi tiết thiết kế phân cấp và hoạt ảnh cho 10 cây trồng
├── file_descriptions.md      # Mô tả ngắn gọn chức năng của từng tệp trong thư mục gốc
├── generate_models.js        # Script Node.js sinh tự động các mô hình 3D từ các khối cơ bản (Primitives)
├── package.json              # Khai báo các gói phụ thuộc (cho môi trường sinh tự động Node.js)
└── package-lock.json         # Tệp khóa phiên bản các gói phụ thuộc npm
```

---

## 3. Bản đồ Nông trại 3D & Danh mục Mô hình (Farm Map & Models Catalog)

### 3.1. Bản đồ Nông trại 3D (Farm Map)
Bản đồ nông trại được thiết kế dựa trên hệ thống ô lưới địa hình kích thước **8x8 ô gạch** (mỗi ô rộng `0.95`, cao `0.2`).
*   **Phân vùng gạch địa hình**:
    *   `0`: Cỏ xanh (vật liệu cỏ nhám màu xanh lục `0x78ab46`).
    *   `1`: Đường đi (vật liệu màu đất cát `0xdfc49c`).
    *   `2`: Đất trồng cày xới (vật liệu màu đất mùn tối `0x8b5a2b`).
    *   `3`: Sông nước cắt ngang bản đồ (vật liệu xanh nước biển trong suốt, nhận phản xạ nhạt `0x3388cc`, độ mờ `0.85`).
    *   `4`: Cầu gỗ bắc ngang sông tại cột 3 (được dựng từ các ván gỗ ngang và hai thanh dầm dọc).
*   **Các công trình cố định trên Bản đồ**:
    *   *Nhà kho đỏ (Barn)*: Đặt tại góc trên bên trái, dựng từ khung đỏ, mái dốc xiên đỏ sẫm, cổng gỗ vàng chữ X đặc trưng và các thanh viền trắng.
    *   *Rừng thông xung quanh*: Tự động bố trí 8 cụm cây thông (`assets/models/tree.glb`) tại các vị trí rìa ngoài của bản đồ nông trại để tạo cảnh quan.
*   **Đặt mô hình thu nhỏ lên Bản đồ**:
    *   Tự động phát hiện, tải song song và điều chỉnh tỷ lệ scale của các mô hình GLB (`duck`, `avocado`, `horse`, `flamingo`, `fox`) về kích thước ô gạch (từ `0.35` đến `0.65`).
    *   Tự động căn chỉnh trục Y-min (đáy mô hình) chạm đúng bề mặt của ô lưới địa hình dựa trên phép tính hộp bao (Bounding Box) để vật thể không bị lơ lửng hay lún dưới đất.
    *   Kích hoạt hoạt cảnh của các mô hình cùng chạy đồng thời trên bản đồ.

### 3.2. Danh mục mô hình 3D trong hệ thống (Models List)
Hệ thống quản lý một danh sách chi tiết các mô hình thông qua biến cấu hình toàn cục `modelsData` trong `viewer.js`, phân loại thành:
1.  **Bản đồ cảnh quan**: Bản đồ nông trại 3D trực quan 8x8 tích hợp sông, cầu, nhà kho và các vật nuôi.
2.  **Mô hình nhập khẩu từ GLB (Tĩnh/Hoạt cảnh có sẵn)**:
    *   *Con vịt màu vàng (duck.glb)*: 117 KB, vật nuôi nhỏ.
    *   *Quả bơ cắt đôi (avocado.glb)*: 8.13 MB, nông sản cao cấp.
    *   *Chú ngựa nâu (horse.glb)*: 177 KB, hoạt cảnh phi nước kiệu.
    *   *Chim hồng hạc (flamingo.glb)*: 77 KB, hoạt cảnh bay lượn.
    *   *Chú cáo nhỏ (fox.glb)*: 159 KB, động vật cảnh chạy quanh nông trại.
3.  **Mô hình tự sinh bằng Primitives (Có hoạt cảnh động lập trình)**:
    *   *Máy cày Nông trại (tractor.glb)*: 72.8 KB, trang bị đèn pha phát sáng (emissive), cabin rỗng chứa vô lăng nghiêng, ghế da, lốp xe vân nổi có vành trắng bạc, chắn bùn sau và ống xả có khói xả động.
    *   *10 loại Cây trồng (Crops)*: Đều được đặt trong chậu terracotta đất nung đỏ, đất mùn và sỏi trang trí, có cấu trúc `sway_group` để đung đưa trước gió:
        1.  *Corn (Cây ngô)*: Thân phân đoạn, 6 lá uốn cong phân tầng ghép phân đoạn, 2 bắp ngô hạt vàng lộ vỏ mạ và râu ngô úa cam.
        2.  *Rice (Cây lúa nước)*: Cụm lúa trĩu quả hạt vàng, thân Cylinder mảnh chụm ở gốc.
        3.  *Carrot (Cây cà rốt)*: Củ cà rốt cam nhô nửa lên khỏi mặt đất, lá ngọn kép răng cưa nhỏ ghép từ nhiều thanh xiên.
        4.  *Tomato (Cây cà chua)*: Thân leo quấn quanh khung gỗ chữ V, chùm lá tròn xum xuê, quả chín đỏ và quả xanh treo lủng lẳng.
        5.  *Sunflower (Hoa hướng dương)*: Thân thẳng cao, lá đối xứng dẹt, đầu nhị nâu phẳng và vòng cánh hoa chéo vàng hướng về một phía.
        6.  *Eggplant (Cây cà tím)*: Thân phân nhánh xanh tím, quả giọt nước tím sẫm rủ xuống với cuống xanh to che đầu.
        7.  *Pumpkin (Cây bí ngô)*: Quả bí ngô lớn khía múi tròn sát đất, dây leo bò lượn dưới đất và lá ngũ giác rộng (quả giữ cố định, lá dây đung đưa).
        8.  *Cabbage (Cải bắp)*: Lớp lá ngoài to xòe cong sát đất màu xanh đậm đung đưa, lá cuộn trong ôm chặt khối cầu xanh nhạt.
        9.  *Chili (Cây ớt)*: Thân mảnh phân nhánh xanh lục, lá nhỏ thuôn, quả ớt nón cong nhỏ chín đỏ và xanh mọc chĩa lên hoặc rủ xuống.
        10. *Strawberry (Bụi dâu tây)*: Bụi lá thấp ba chạc sát miệng chậu, hoa trắng nhị vàng, quả dâu đỏ hình nón lốm đốm hạt vàng rủ quanh chậu.
4.  **Hệ thống 30+ công trình, vật nuôi mới và NPCs** được quy hoạch thiết kế chi tiết trong tài liệu `rules.md` (bao gồm: Cối xay gió quay cánh quạt, Bù nhìn rơm đế chữ X, Heo hồng vẩy tai ngoáy đuôi, Chuồng gà chong chóng gió xoay, Bác nông dân vung cuốc bổ đất, v.v.).

---

## 4. Cơ chế Hoạt cảnh & Chuyển động (Animations & Movement Systems)

Viewer hỗ trợ chạy đồng thời nhiều loại hoạt cảnh khác nhau thông qua vòng lặp render chính `animate()` và đối tượng thời gian `THREE.Clock`:

### 4.1. Hoạt cảnh Nạp từ Tệp GLB (GLTF Animations)
Sử dụng `THREE.AnimationMixer` để phát các keyframe animation được nhúng sẵn trong tệp GLB:
*   Ở chế độ xem mô hình đơn lẻ: Quản lý bởi một biến `mixer` toàn cục. Hỗ trợ dropdown chọn hoạt cảnh động lập trình trên UI để người dùng chuyển đổi.
*   Ở chế độ Bản đồ (Map mode): Quản lý bởi mảng `mixers` toàn cục. Duyệt và cập nhật liên tục tất cả các hoạt cảnh cho các con vật nằm trên bản đồ (như ngựa chạy, hạc bay, cáo đùa nghịch) ở mỗi khung hình để nông trại hoạt động sinh động cùng lúc.

### 4.2. Hoạt cảnh Lập trình Thủ công (Procedural Scripted Animations)
Chạy trực tiếp dựa vào giá trị thời gian tích lũy `elapsedTime` và lượng sai khác thời gian `delta`:

*   **Bánh xe máy cày xoay tròn (Tractor Wheels)**:
    *   Tự động tìm kiếm các bộ phận có tên bắt đầu bằng `wheel_` của máy cày.
    *   Áp dụng xoay cục bộ theo trục X (`wheel.rotation.x += delta * 3.0`) tạo cảm giác máy cày đang di chuyển.
*   **Khói xả ống khói máy cày (Exhaust Smoke)**:
    *   Nhóm khói `smoke_group` chứa 3 quả cầu khói xám mờ.
    *   Áp dụng vòng lặp 3 giây tuần hoàn: Di chuyển tịnh tiến lên phía trên theo Y và lùi nhẹ ra sau theo Z.
    *   Co giãn kích thước (Scale) đồng thời theo hàm hình sin nhấp nhô để giả lập hiệu ứng bong bóng khói xả phụt ra ngoài thực tế.
*   **Đung đưa trước gió (Wind Sway Animation - Sway Group)**:
    *   *Nguyên lý hoạt động*: Viewer tự động quét qua cấu trúc nhóm của mô hình. Nếu phát hiện các nút Group/Mesh chứa cụm từ `sway_group` hoặc `leaves_group`, nó sẽ tự động đăng ký vào danh sách hoạt ảnh đung đưa trước gió.
    *   *Lệch pha (Phase Offset)*: Nhằm tránh toàn bộ cây cối đung đưa song song đều chằn chặn gây mất tự nhiên, thuật toán áp dụng một độ lệch pha dựa vào vị trí tọa độ thế giới (World Position) của vật thể:
        $$\text{phase} = x_{\text{world}} \times 2.5 + z_{\text{world}} \times 1.8$$
    *   *Chuyển động lượng giác*: Áp dụng dao động xoay nhỏ không đồng bộ trên hai trục X và Z bằng hàm lượng giác tuần hoàn:
        $$\text{rotation.x} = \text{initialRotX} + \sin(\text{elapsedTime} \times 1.2 + \text{phase}) \times 0.05$$
        $$\text{rotation.z} = \text{initialRotZ} + \cos(\text{elapsedTime} \times 1.0 + \text{phase}) \times 0.04$$
    *   Cơ chế này áp dụng thành công cho lá cây thông rừng trên bản đồ và toàn bộ phần thân, tán lá, bắp quả của 10 cây trồng nông nghiệp.

---

## 5. Đường ống Sinh tài nguyên tự động (Procedural Asset Generation Pipeline)

Hệ thống tích hợp một công cụ CLI chạy trên Node.js (`generate_models.js`) để tạo lập tự động các mô hình 3D phức tạp mà không cần dùng đến phần mềm đồ họa bên ngoài (như Blender).

### 5.1. Giả lập Môi trường Trình duyệt trên Node.js:
Vì thư viện `THREE.GLTFExporter` của Three.js được thiết kế chạy trên trình duyệt sử dụng API của Web Client, tệp `generate_models.js` đã thực hiện giả lập môi trường Web bằng cách:
*   Gán biến môi trường: `global.self = global` và `global.window = global`.
*   Mock lớp `FileReader` toàn cục bằng một class tùy chỉnh `FileReaderMock` hỗ trợ các hàm `readAsDataURL` và `readAsArrayBuffer` thông qua việc chuyển đổi trực tiếp `Blob` sang Node.js `Buffer` để xuất tệp nhị phân GLB không đồng bộ trong Terminal.

### 5.2. Luồng hoạt động sinh và xuất mô hình:
1.  Sử dụng ES modules động (`import('three')` và `import('three/examples/jsm/exporters/GLTFExporter.js')`) để tải thư viện.
2.  Gọi các hàm sinh hình học (như `createTomatoCrop`, `createCarrotCrop`, `createRiceCrop`, `createCornCrop`, `createDrone`, `createWheelbarrow`, `createHarvester`, `createPigPen`, `createPickupTruck`, v.v.) thiết lập chất liệu nhám, màu sắc phẳng chắt lọc, và cấu trúc cây phân cấp (Groups).
3.  Áp dụng **Keyframe Hoạt cảnh Nảy mầm/Tăng trưởng (Growth Animation)**:
    *   Tạo ra một Group con có tên `scale_group` bao bọc toàn bộ phần thân cây/lá quả phía trên.
    *   Tạo đường ray hoạt cảnh tỷ lệ scale `THREE.VectorKeyframeTrack` từ tỉ lệ cực nhỏ `Vector3(0.01, 0.01, 0.01)` tại giây thứ 0 tăng trưởng đạt kích thước đầy đủ `Vector3(1.0, 1.0, 1.0)` tại giây thứ 2.
    *   Đóng gói thành một đối tượng hoạt cảnh `THREE.AnimationClip('Grow', 2.0, [trackScale])` và đính kèm vào `userData.animations`.
4.  Thực hiện xuất nhị phân GLB bằng `GLTFExporter.parse()` và ghi dữ liệu ra đĩa cứng thông qua thư viện hệ thống tệp tin Node.js `fs.writeFileSync(path.join(__dirname, 'assets', 'models', 'name.glb'), buffer)`.

---

## 6. Tích hợp Bộ xuất GLB (GLB Exporter Integration)

Tại giao diện Viewer ở Client, hệ thống cung cấp một nút bấm **💾 Xuất file .GLB** cho phép người dùng tải xuống trực tiếp mô hình đang hiển thị:
*   **Trình xử lý sự kiện**: Khi người dùng nhấn nút, hệ thống hiển thị lớp phủ Loading với thông điệp `"Đang xử lý xuất file GLB..."`.
*   **Trích xuất**: `THREE.GLTFExporter` sẽ phân tích đối tượng `currentModel` (có thể là một mô hình đơn hoặc toàn bộ Bản đồ Nông trại lớn 8x8 bao gồm cả nhà cửa, sông ngòi, cầu cống, vật nuôi, cây thông và các hoạt cảnh).
*   **Định cấu hình xuất**:
    *   `binary: true`: Đóng gói dưới dạng nhị phân `.glb` giúp tối ưu dung lượng và tích hợp mọi texture/màu sắc vào bên trong tệp đơn lẻ.
    *   `animations: currentModel.userData.animations || []`: Đính kèm theo các track hoạt cảnh của mô hình để tệp xuất ra có thể chuyển động bình thường khi nhập vào các công cụ khác.
    *   `onlyVisible: true`: Chỉ xuất những phần tử đang hiển thị trên Scene.
*   **Tải xuống**:
    *   Tạo một đối tượng `Blob` nhị phân từ dữ liệu ArrayBuffer xuất ra.
    *   Sử dụng API DOM tạo liên kết ảo `<a>`, gán đường dẫn blob URL, đặt tên file theo ID mô hình (ví dụ: `tractor.glb`, `corn.glb`, `farm_map.glb`) và kích hoạt sự kiện `.click()` để trình duyệt tải tệp về máy tính người dùng.

---

## 7. Các quy tắc Kỹ thuật & Đồ họa cốt lõi (Technical & Graphic Constraints)

*   **Giới hạn lưới đa giác (Polygon Budget)**: Mỗi mô hình 3D tự sinh hoặc thiết kế ngoài bắt buộc không được vượt quá **5.000 polygons** để đảm bảo ứng dụng vận hành mượt mà 60 FPS trên cả thiết bị di động.
*   **Quy tắc Căn chỉnh Pivot (Alignment Rules)**: Điểm gốc trục tọa độ của mô hình phải nằm chính xác ở đáy của vật thể ($Y = 0$) và nằm ở tâm mặt phẳng XZ ($X = 0, Z = 0$) để dễ dàng đặt trực tiếp lên các ô lưới địa hình mà không bị chênh lệch vị trí.
*   **Nguyên tắc Màu sắc & Chất liệu**: Sử dụng các vật liệu chuẩn `MeshStandardMaterial` phẳng phẳng (flatShading) và điều chỉnh độ nhám (`roughness`), độ phản xạ kim loại (`metalness`) phù hợp cho lốp xe, kính, kim loại để tạo điểm nhấn low-poly sắc nét dưới hệ thống đèn chiếu sáng 3D.
