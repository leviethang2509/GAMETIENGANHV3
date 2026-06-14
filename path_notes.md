kh# ĐƯỜNG DẪN TRUY NGƯỢC NGUỒN TÀI NGUYÊN (PATH & ASSETS NOTES)

Tài liệu này lưu trữ đường dẫn nguồn của các mô hình 3D (3D Models) và thư viện được sử dụng trong dự án Game Nông Trại V3 để có thể dễ dàng truy xuất nguồn gốc, cập nhật phiên bản hoặc tải lại khi cần thiết.

## 1. Thư viện Front-end (CDNs)
- **Three.js (Core Library)**: 
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
  - Mô tả: Thư viện nền tảng để dựng và render cảnh 3D trên WebGL.
- **OrbitControls (Điều khiển camera)**:
  - URL: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js`
  - Mô tả: Plugin giúp người dùng tương tác xoay, thu phóng và di chuyển camera bằng chuột hoặc cảm ứng.
- **GLTFLoader (Tải mô hình GLTF/GLB)**:
  - URL: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js`
  - Mô tả: Plugin hỗ trợ tải và đọc định dạng file 3D `.gltf` hoặc `.glb`.
- **GLTFExporter (Xuất mô hình ra GLTF/GLB)**:
  - URL: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js`
  - Mô tả: Plugin xuất mô hình Three.js hiện có ra cấu trúc file JSON hoặc nhị phân binary GLB để lưu trữ tái sử dụng.

## 2. Danh sách Mô hình 3D (3D Models)
Dưới đây là các mô hình 3D nông trại được sử dụng trong dự án, được tải về từ các kho lưu trữ mã nguồn mở/miễn phí chất lượng cao hoặc sinh tự sinh bằng hình học cơ bản:

### Mô hình 1: Con vịt nông trại (Duck)
- **Nguồn**: Khronos Group glTF Sample Models
- **URL gốc**: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb`
- **Đường dẫn trong dự án**: `assets/models/duck.glb`
- **Mô tả**: Con vịt màu vàng, thích hợp làm vật nuôi trong nông trại.

### Mô hình 2: Quả bơ (Avocado - Nông sản)
- **Nguồn**: Khronos Group glTF Sample Models
- **URL gốc**: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb`
- **Đường dẫn trong dự án**: `assets/models/avocado.glb`
- **Mô tả**: Quả bơ chín cắt đôi, thích hợp làm nông sản cao cấp.

### Mô hình 3: Ngựa (Horse - Động vật nông trại)
- **Nguồn**: Three.js dev examples models
- **URL gốc**: `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Horse.glb`
- **Đường dẫn trong dự án**: `assets/models/horse.glb`
- **Mô tả**: Chú ngựa đang phi nước kiệu, dùng làm vật nuôi lớn/thú cưỡi hoặc kéo xe trong nông trại.

### Mô hình 4: Chim hồng hạc (Flamingo - Sinh vật nông trại)
- **Nguồn**: Three.js dev examples models
- **URL gốc**: `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo.glb`
- **Đường dẫn trong dự án**: `assets/models/flamingo.glb`
- **Mô tả**: Chim hồng hạc bay lượn, tăng độ sinh động cho bầu trời nông trại.

### Mô hình 5: Cáo (Fox - Động vật hoang dã quanh nông trại)
- **Nguồn**: Khronos Group glTF Sample Models
- **URL gốc**: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb`
- **Đường dẫn trong dự án**: `assets/models/fox.glb`
- **Mô tả**: Chú cáo nhỏ đáng yêu hay lảng vảng gần nông trại, có thể chạy/nhảy hoặc đứng.

### Mô hình 6: Máy cày Nông trại (Tractor)
- **Nguồn**: Sinh dựng động bằng Three.js Primitives
- **Đường dẫn trong dự án**: Nội bộ (`GENERATED_TRACTOR` trong `js/viewer.js` - Có thể xuất ra file `.glb` thông qua nút bấm)
- **Mô tả**: Máy cày màu đỏ cam phong cách Low-poly chi tiết cao: đèn pha phát sáng, cabin lái chứa vô lăng/ghế ngồi, ống khói phun khói, mâm vành bánh xe và chắn bùn.

### Mô hình 7: Cây ngô (Corn Crop)
- **Nguồn**: Sinh dựng động bằng Three.js Primitives
- **Đường dẫn trong dự án**: Nội bộ (`GENERATED_CORN` trong `js/viewer.js` - Có thể xuất ra file `.glb` thông qua nút bấm)
- **Mô tả**: Cây ngô sinh động trồng trong chậu terracotta có đất nung và đá cuội trang trí, lá uốn cong xếp tầng, bắp lộ hạt xếp lớp chi tiết và râu ngô úa trên đỉnh.

### Mô hình 8: Cối xay gió Nông trại (Windmill)
- **Nguồn**: Sinh dựng động bằng Three.js Primitives
- **Đường dẫn trong dự án**: Nội bộ (`GENERATED_WINDMILL` trong `js/viewer.js` - Có thể xuất ra file `.glb` thông qua nút bấm)
- **Mô tả**: Cối xay gió nông trại cổ kính móng đá 2 tầng kiên cố, ban công bát giác có lan can bao quanh, cửa gỗ có panel sắt và tay nắm thau, cánh quạt nan lưới gỗ quay liên tục quanh trục thép có Hub mâm tròn bọc đồng.

### Mô hình 9: Bù nhìn rơm bảo vệ đồng ruộng (Scarecrow)
- **Nguồn**: Sinh dựng động bằng Three.js Primitives
- **Đường dẫn trong dự án**: Nội bộ (`GENERATED_SCARECROW` trong `js/viewer.js` - Có thể xuất ra file `.glb` thông qua nút bấm)
- **Mô tả**: Bù nhìn rơm mộc mạc đặt trên chân đế gỗ chữ X có thanh chống chéo giằng lực, áo flannel vá víu sinh động, dây thừng quấn eo/cổ tay/cổ áo, rơm thò lổm chổm, mũ rộng vành và gương mặt mắt cúc, mũi nón cam cười ngộ nghĩnh.
