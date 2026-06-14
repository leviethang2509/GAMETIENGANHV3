# NGUYÊN TẮC THIẾT KẾ & PHÁT TRIỂN HỆ THỐNG NÔNG TRẠI V3 (RULES.MD)

Tài liệu này định nghĩa các quy tắc cốt lõi, kiến trúc hệ thống, quy trình xử lý tài nguyên (pipeline) và tiêu chuẩn kỹ thuật bắt buộc dành cho dự án **Game Nông Trại V3**. Đây là tài liệu nguồn gốc sự thật (Source of Truth) điều phối toàn bộ hành vi hệ thống.

---

## 1. Quy tắc Kiến trúc Hệ thống (System Architecture Rules)

Hệ thống Game Nông Trại V3 được thiết kế theo mô hình kiến trúc lai hợp nhất (**Hybrid Pipeline**):

*   **Môi trường Phía Máy khách (Frontend/Client Viewer)**:
    *   Chỉ sử dụng HTML5, CSS3 và Javascript thuần (Vanilla JS).
    *   **CẤM TUYỆT ĐỐI** sử dụng các công cụ đóng gói (npm, Webpack, Vite, Rollup) hay bất kỳ công cụ build-tool nào ở client.
    *   Tất cả thư viện cốt lõi (Three.js r128, OrbitControls, GLTFLoader, GLTFExporter) phải được tải trực tiếp từ các CDN mở đáng tin cậy.
    *   Tách biệt rõ ràng logic giao diện hiển thị 3D và logic nghiệp vụ game.

*   **Quy trình Phía Máy chủ/Công cụ (Backend Pipeline)**:
    *   Sử dụng môi trường Node.js làm trình điều phối tài nguyên và sinh lắp ghép cảnh quan tĩnh/đơn giản (`generate_models.js`).
    *   Sử dụng Blender Python API làm đường ống tự động hóa và tối ưu hóa mô hình 3D phức tạp (`blender_scripts/`).
    *   Định dạng lưu trữ và truyền tải tài nguyên chạy thời gian thực (runtime) duy nhất là **.GLB nhị phân**.

---

## 2. Quy tắc Tạo lập Tài nguyên: Blender vs Procedural JS (Asset Creation Rules)

Để đảm bảo hiệu năng và chất lượng đồ họa nghệ thuật, việc phân chia công việc tạo dựng tài nguyên được quy định chặt chẽ:

### A. Thiết kế và Dựng hình bằng Blender (Ưu tiên số 1 cho các vật thể phức tạp)
*   **Đối tượng áp dụng**: Tất cả vật nuôi (Bò, Cừu, Heo, Gà, Dê, Thỏ, Ngỗng, v.v.), nhân vật NPC (Nông dân, Thương nhân, Thợ rèn, Tiều phu, v.v.), phương tiện phức tạp, và công trình lớn.
*   **Nguyên tắc**: Dựng hình low-poly, tối ưu hóa lưới, thiết lập khung xương (Rigging) và tạo các clip hoạt cảnh (Walk, Idle, Action) trực tiếp trong Blender.
*   **Tự động hóa**: Sử dụng script Python trong thư mục `/blender_scripts/` để tự động hóa quy trình dựng, áp chất liệu và xuất file `.glb`.

### B. Sinh mô hình bằng Procedural JS (Chỉ dành cho vật thể đơn giản và lắp ghép)
*   **Đối tượng áp dụng**: Các mô hình cây trồng nông nghiệp (Cà chua, Cà rốt, Lúa nước, Ngô, Hướng dương, Bí ngô, v.v.) trồng trong chậu đất nung Terracotta, lưới địa hình phẳng hoặc cấu trúc cơ học đơn giản.
*   **Nguyên tắc**: Sử dụng các khối hình học cơ bản (Primitives) của Three.js như Cylinder, Cone, Box, Sphere để lắp ráp. Không được thiết kế lưới đa giác thủ công phức tạp trong mã nguồn JS.
*   **Giới hạn**: JS generator chỉ xử lý: lắp ghép cảnh (Scene assembly), Primitives cơ bản và điều phối quá trình xuất file GLB.

---

## 3. Quy tắc Hoạt cảnh & Chuyển động (Animation Rules)

Hệ thống hoạt cảnh được quản lý qua hai cơ chế bổ trợ lẫn nhau:

### A. Hoạt cảnh Khung xương & Keyframe gốc (GLB + AnimationMixer)
*   Tất cả các chuyển động phức tạp (bước chân đi của NPC, con ngựa đang phi, chim hồng hạc đập cánh) phải được thiết kế và xuất trực tiếp từ Blender dưới dạng các Clip hoạt cảnh chuẩn trong tệp `.glb`.
*   Tại runtime, Three.js sử dụng `THREE.AnimationMixer` để phát và trộn các hoạt cảnh này.
*   **CẤM** lập trình thủ công bằng mã JS cho các khớp xương nhân vật hoặc mô phỏng hoạt cảnh khung xương tự chế.

### B. Hoạt cảnh Lập trình Thủ công qua mã (Procedural Animations)
Chỉ áp dụng cho các hiệu ứng vật lý môi trường hoặc cơ học đơn giản trong vòng lặp render:
1.  **Quay bánh xe/Trục cơ học**: Xoay quanh trục cố định (Ví dụ: Bánh xe máy cày xoay theo trục X, cánh quạt cối xay gió xoay theo trục Z).
2.  **Khói xả hạt (Smoke Particles)**: Sử dụng các Mesh cầu co giãn scale và tịnh tiến lên phía trên để mô phỏng khói.
3.  **Đung đưa trước gió (Wind Sway)**:
    *   Tất cả các thành phần đung đưa (lá cây, bông lúa, ngọn hoa) phải được đặt trong nhóm có tiền tố tên `sway_group` hoặc `leaves_group`.
    *   Trình xem phải tự động quét cấu trúc và gán chuyển động lượng giác hình sin/cos lệch pha dựa trên tọa độ thế giới (World Position) của vật thể để tạo độ tự nhiên so le:
        $$\text{phase} = x_{\text{world}} \times 2.5 + z_{\text{world}} \times 1.8$$

---

## 4. Quy ước Đặt tên (Naming Conventions)

Sự nhất quán về tên gọi là bắt buộc để các hệ thống quét tự động (như Wind Sway, Wheel Rotation) hoạt động chính xác:

*   **Tên tệp tin mô hình**: Đặt ở dạng viết thường, phân tách bằng dấu gạch dưới (Ví dụ: `crop_tomato.glb`, `farm_map.glb`, `scarecrow.glb`).
*   **Nút xương/Nhóm đung đưa trước gió**: Bắt buộc phải bắt đầu hoặc chứa từ khóa `sway_group` hoặc `leaves_group`.
*   **Nhóm bánh xe quay máy móc**: Bắt đầu bằng tiền tố `wheel_` (Ví dụ: `wheel_fl`, `wheel_front`).
*   **Nhóm khói xả khí thải**: Đặt tên là `smoke_group`.
*   **Mô hình tăng trưởng**: Group chứa cây trồng tăng trưởng bọc bởi tên `scale_group` phục vụ cho hoạt cảnh Scale-based Grow (0.01 -> 1.0).

---

## 5. Ràng buộc Hiệu năng & Chỉ số Kỹ thuật (Performance Constraints)

Để đảm bảo trò chơi chạy ổn định mượt mà ở tốc độ **60 FPS** trên cả thiết bị di động cũ:

*   **Ngân sách Đa giác (Polygon Budget)**: Mỗi mô hình 3D đơn lẻ khi xuất ra không được vượt quá **5.000 polygons (tam giác)**.
*   **Tối ưu hóa Bộ nhớ (Memory Disposal)**:
    *   Khi chuyển đổi hoặc xóa bỏ mô hình, bắt buộc phải giải phóng (`dispose()`) toàn bộ Geometries, Materials và Textures liên quan để tránh rò rỉ bộ nhớ (memory leak).
*   **Căn giữa và Tọa độ (Alignment & Pivot)**:
    *   Mọi vật thể 3D độc lập phải có điểm gốc (Pivot point) nằm ở đáy dưới cùng ($Y = 0$) và căn giữa theo mặt phẳng ngang ($X = 0, Z = 0$).
*   **Tần suất Render**: Render loop sử dụng `requestAnimationFrame` và chỉ cập nhật các phép biến hình thực sự cần thiết theo thời gian Delta.

---

## 6. Quy trình Xử lý Tài nguyên lai (Pipeline Workflow)

Quy trình xuất bản một tài nguyên 3D trong Game Nông Trại V3 phải tuân thủ nghiêm ngặt 4 bước:

```
[1. Blender / Python] ──> [2. Xuất GLB] ──> [3. Node.js CLI / Assembler] ──> [4. Three.js Viewer]
  - Dựng hình low-poly      - Nhúng sẵn      - generate_models.js         - Tải động GLB
  - Rigging / Animations    animations       - Đóng gói & lưu tĩnh        - Render 60 FPS
```

1.  **Bước 1 (Blender & Python)**: Nghệ sĩ thiết kế mô hình hoặc chạy script Python tự động hóa trong Blender để tạo hình, thiết lập xương và xuất hoạt cảnh.
2.  **Bước 2 (Xuất tệp GLB)**: Đóng gói toàn bộ mô hình kèm vật liệu, màu sắc và hoạt cảnh chuẩn thành một tệp tin `.glb` duy nhất.
3.  **Bước 3 (Node.js CLI & Assembler)**: Chạy `generate_models.js` để tự động hóa việc kết xuất mô hình từ primitives (nếu có), lắp ghép cấu trúc chậu đất hoặc thiết lập đường chạy hoạt cảnh tăng trưởng, sau đó lưu tĩnh vào thư mục công cộng `assets/models/`.
4.  **Bước 4 (Three.js Viewer)**: Trình duyệt tải động tệp tin `.glb` tĩnh từ máy chủ qua `GLTFLoader`, căn chỉnh camera và đưa vào Scene để hiển thị thời gian thực.

---

## 7. Các hành vi và thiết kế bị CẤM (Forbidden Patterns)

*   **CẤM** mô phỏng thủ công hệ thống xương khớp (Skeletal Rigging) hoặc tính toán ma trận biến dạng da (Skinning) phức tạp bằng code Javascript.
*   **CẤM** tạo cấu trúc GLB giả (fake GLB structure) không tương thích chuẩn GLTF bằng cách ghi đè byte thủ công thiếu kiểm chuẩn.
*   **CẤM** trùng lặp logic chuyển động (Ví dụ: Vừa thiết lập hoạt cảnh cánh quạt quay trong Blender vừa code JS để xoay cánh quạt đó ở viewer). Chọn 1 trong 2 phương án và tuân thủ quy ước đặt tên.
*   **CẤM** sử dụng các cấu trúc dữ liệu hình học hoặc chất liệu nặng không được dọn dẹp khi đổi mô hình trên Viewer.
*   **CẤM TUYỆT ĐỐI** tự ý thực hiện lệnh `git push` lên kho lưu trữ từ xa (remote repository) mà chưa được sự đồng ý hoặc hướng dẫn rõ ràng từ phía người dùng.
