# MÔ TẢ CHI TIẾT TỪNG FILE DỰ ÁN (FILE DESCRIPTIONS)

Tài liệu này giải thích cấu trúc thư mục và vai trò cụ thể của từng file trong dự án Game Nông Trại V3. Nó đóng vai trò là bản đồ hướng dẫn cho lập trình viên phát triển game sau này.

## 1. Cấu trúc thư mục hiện tại
```
GAMENONGTRAIV3/
│
├── assets/
│   └── models/               # Thư mục chứa các mô hình 3D (.glb, .gltf)
│       ├── duck.glb          # Mô hình con vịt nông trại
│       ├── avocado.glb       # Mô hình quả bơ (nông sản)
│       ├── horse.glb         # Mô hình chú ngựa nông trại
│       ├── flamingo.glb      # Mô hình chim hồng hạc nông trại
│       └── fox.glb           # Mô hình chú cáo (động vật hoang dã)
│
├── js/
│   └── viewer.js             # File script chính thiết lập Three.js và điều khiển Viewer (bao gồm bộ sinh mô hình và xuất GLB)
│
├── index.html                # Trang giao diện chính xem mô hình (tích hợp GLTFExporter CDN và nút Xuất GLB)
├── style.css                 # File định dạng giao diện UI (nút bấm, bố cục trang)
│
├── rules.md                  # Tài liệu nguyên tắc lập trình, đồ họa, thiết kế mô hình tự sinh và xuất GLB
├── path_notes.md             # Tài liệu lưu trữ nguồn gốc và link tải mô hình cùng các thư viện CDN
├── model_movement_plan.md    # Tài liệu cấu trúc phân cấp và kế hoạch hoạt cảnh máy cày & cây thông
└── file_descriptions.md      # Tài liệu này (mô tả chi tiết từng file)
```

## 2. Mô tả chi tiết chức năng từng file

### A. Tài liệu dự án (Documentation)
- **`rules.md`**: Đưa ra các tiêu chuẩn bắt buộc phải tuân theo khi lập trình (không Node.js, chỉ dùng JS thuần qua CDN, tối ưu poly...), thiết kế mô hình tự sinh bằng Primitives (các chi tiết để trông chân thật hơn) và quy tắc xuất GLB.
- **`path_notes.md`**: Ghi chép nguồn gốc, đường dẫn tải các file 3D và tài nguyên thư viện CDN (bao gồm GLTFExporter.js) để sau này dễ dàng mở rộng.
- **`file_descriptions.md`**: Bản đồ dự án giúp hiểu nhanh cấu trúc, vị trí lưu trữ và công dụng của từng thành phần trong game.

### B. Giao diện & Trực quan hóa (Frontend & Viewer)
- **`index.html`**: 
  - Khai báo cấu trúc HTML của ứng dụng Viewer.
  - Chứa container `<div id="canvas-container">` để Three.js render cảnh 3D.
  - Tích hợp thanh bên (sidebar) liệt kê danh sách các mô hình 3D có sẵn.
  - Nạp các thư viện CDN cần thiết bao gồm: Core Three.js, OrbitControls, GLTFLoader và GLTFExporter.
  - Nút bấm `💾 Xuất file .GLB` nằm trong bảng điều khiển giúp xuất mô hình hiện tại về máy tính.
- **`style.css`**:
  - Thiết kế giao diện hiển thị 3D hiện đại, thân thiện mang phong cách nông trại phẳng.
  - Định dạng bảng điều khiển UI chọn mô hình, thanh trượt cấu hình hiển thị, nút bấm xuất file GLB, và nhãn thông tin đa giác/đỉnh.
- **`js/viewer.js`**:
  - Khởi tạo môi trường 3D cơ bản (Scene, Camera, Renderer, Fog) và ánh sáng (Ambient, Directional, Hemisphere).
  - Thiết lập OrbitControls cho phép tương tác góc nhìn và xoay tự động.
  - Tải động mô hình 3D được chọn bằng `GLTFLoader`.
  - Tự động căn chỉnh camera và mô hình (Auto-center & Auto-fit) dựa trên Bounding Box.
  - Tạo các mô hình sinh động tự sinh với độ chi tiết cao bằng Three.js Primitives:
    - **Máy cày (Tractor)**: Đèn pha phát sáng, vô lăng, ghế lái, lưới tản nhiệt sọc, ống xả và các quả cầu khói, mâm vành bánh xe và chắn bùn sau.
    - **Cây ngô (Corn)**: Chậu terracotta chứa đất/đá cuội, 6 lá ngô uốn cong phân tầng, bắp ngô lộ hạt tròn xếp tầng, lá vỏ bọc và râu ngô.
    - **Cối xay gió (Windmill)**: Móng đá bát giác 2 tầng, tháp trắng, ban công lan can bát giác chi tiết, cửa gỗ có panel sắt và tay nắm đồng, cửa sổ kính xanh, cánh quạt lattice nan gỗ quay liên tục quanh trục thép có Hub bọc đồng.
    - **Bù nhìn rơm (Scarecrow)**: Đế gỗ chữ X chịu lực có giằng chống chéo, thân áo flannel có các miếng vá chéo, thắt lưng thừng, rơm lổm chổm ở cổ tay/cổ áo/gấu áo, đầu bao cát có chi tiết mắt cúc/mũi cà rốt/miệng chỉ khâu cười, mũ rộng vành có ruy băng.
  - Quản lý sự kiện xuất file `.glb` thông qua `THREE.GLTFExporter` bằng cách phân tách cấu trúc nhóm mô hình sang binary arraybuffer và tải xuống trình duyệt dưới dạng file nhị phân.
  - Vòng lặp render cập nhật hoạt cảnh chuyển động của mô hình đơn, mô hình trên map và xoay cánh quạt cối xay gió.
