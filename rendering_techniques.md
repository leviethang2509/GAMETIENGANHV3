# KỸ THUẬT RENDER MÔ HÌNH 3D TRONG GAME NÔNG TRẠI V3 (3D RENDERING TECHNIQUES)

Tài liệu này chi tiết toàn bộ kỹ thuật đồ họa 3D, tính toán ánh sáng, khử răng cưa, tối ưu hiệu năng và hoạt ảnh lượng giác được triển khai trong ứng dụng để đảm bảo hiệu ứng trực quan đẹp mắt và vận hành mượt mà ở 60 FPS.

---

## 1. Hệ thống Ánh sáng & Đổ bóng (Lighting & Shadows)
Hệ thống sử dụng mô hình chiếu sáng phức hợp kết hợp ánh sáng trực tiếp và ánh sáng gián tiếp để mô tả khối hình học low-poly rõ nét nhất:
*   **Ambient Light (Ánh sáng môi trường)**:
    *   Sử dụng lớp `THREE.AmbientLight` với màu sắc trung tính khởi tạo (`0xdff9fb`).
    *   Cung cấp mức chiếu sáng nền tối thiểu để tránh các góc khuất bị tối đen hoàn toàn. Cường độ ánh sáng thay đổi động từ `0.2` (Ban đêm) đến `0.7` (Buổi trưa).
*   **Directional Light (Mặt trời & Mặt trăng)**:
    *   Sử dụng lớp `THREE.DirectionalLight` làm nguồn sáng chính chiếu từ trên cao.
    *   Vị trí nguồn sáng di chuyển tuần hoàn tùy thuộc vào thời gian trong ngày (Ví dụ: Trưa ở vị trí cao `[-150, 250, 150]`, Chiều tà hạ thấp về phía Đông `[250, 100, 100]`).
    *   Cường độ thay đổi mượt mà từ `0.25` (Trăng đêm) đến `1.5` (Nắng trưa).
*   **Cơ chế Đổ bóng mềm (Shadow Maps)**:
    *   Kích hoạt shadow map trên bộ dựng hình bằng `renderer.shadowMap.enabled = true`.
    *   Sử dụng giải thuật **`THREE.PCFSoftShadowMap`** (Percentage-Closer Filtering) để làm mịn rìa bóng đổ mà không tốn nhiều tài nguyên GPU.
    *   Cấu hình shadow camera orthographic phủ toàn bộ khuôn viên trang trại với bản đồ shadow map độ phân giải lớn `2048x2048` pixel:
        ```javascript
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.bias = -0.0005; // Giảm thiểu hiện tượng sọc bóng đổ (shadow acne)
        ```

---

## 2. Kỹ thuật Chất liệu & Shader Low-Poly (Materials & Styling)
Để đạt được phong cách đồ họa low-poly dạng khối phẳng nghệ thuật:
*   **Flat Shading**: Tất cả các chất liệu (`MeshStandardMaterial`, `MeshPhysicalMaterial`) đều được thiết đặt thuộc tính `flatShading: true`. Thuộc tính này bỏ qua việc nội suy vector pháp tuyến giữa các đỉnh mặt lưới (Normal Interpolation), giữ nguyên bề mặt sắc cạnh của từng tam giác đa giác.
*   **MeshStandardMaterial (Vật liệu chuẩn PBR)**:
    *   Áp dụng cho đất cỏ, tường đá, các công trình và cây cối.
    *   Sử dụng thuộc tính `roughness` (độ nhám) cao từ `0.8` đến `0.95` để tránh phản quang quá mức, tạo bề mặt nhám giống gỗ, đất cát và lá cây.
*   **MeshPhysicalMaterial (Vật liệu nước biển)**:
    *   Áp dụng cho mặt nước biển trong suốt ở tiền cảnh.
    *   Thiết lập thuộc tính khúc xạ nâng cao:
        ```javascript
        new THREE.MeshPhysicalMaterial({
            color: 0x3498db,
            roughness: 0.15,
            metalness: 0.15,
            transmission: 0.65, // Truyền dẫn ánh sáng qua vật thể
            thickness: 1.5,      // Độ dày giả lập khúc xạ
            transparent: true,
            opacity: 0.85,
            flatShading: true
        });
        ```

---

## 3. Hiệu ứng Thời tiết & Các hạt Phần tử (Weather & Particle Systems)
Hệ thống tạo các hạt môi trường bằng `THREE.BufferGeometry` và các đối tượng hình học dạng điểm hoặc đường thẳng tối giản:
*   **Rain Mode (Mưa rơi)**: Sử dụng các đoạn thẳng đứng `THREE.LineSegments` với màu lam nhạt `0xa8c5db` mờ (`opacity: 0.25`). Hoạt ảnh di chuyển các điểm dọc theo trục Y đi xuống với vận tốc ngẫu nhiên và hồi sinh hạt khi chạm đất.
*   **Snow Mode (Tuyết rơi)**: Sử dụng `THREE.Points` với hạt tuyết kích thước nhỏ `size: 1.2`. Hoạt ảnh tuyết rơi kết hợp chuyển động hình sin lắc lư theo phương ngang ($X$) giả lập lực cản gió thổi:
    $$\Delta x = \sin(y \times 0.05 + \text{index}) \times 6 \times \Delta t$$
*   **Dust Mode (Bụi nắng lung linh)**: Sử dụng các hạt điểm màu vàng sáng ấm áp bay lơ lửng, trôi dạt chậm rãi trong không gian theo cả 3 chiều để tăng không khí ngày nắng ấm.
*   **Wind Mode (Gió thổi)**: Tạo các vệt sương gió nằm ngang chuyển động nhanh qua màn hình ở chế độ sương mù.

---

## 4. Chuyển đổi Thời gian trong Ngày (Time-of-Day Lerp Transitions)
Để chuyển đổi mượt mà giữa các khoảng thời gian Sáng (Morning), Trưa (Noon), Chiều (Afternoon) và Tối (Night):
1.  **Cấu hình trạng thái mục tiêu (todConfigs)**: Lưu trữ các tham số màu sắc bầu trời, sương mù, ánh sáng mặt trời, cường độ và trạng thái phát sáng của cửa sổ cho từng thời điểm.
2.  **Thuật toán Lerp tuyến tính (Linear Interpolation)**:
    Trong vòng lặp render, hệ thống liên tục nội suy màu sắc và giá trị số từ trạng thái hiện tại sang trạng thái đích dựa vào lượng thời gian trôi qua `delta`:
    ```javascript
    const lerpSpeed = delta * 2.0;
    scene.background.lerp(skyColorTarget, lerpSpeed);
    scene.fog.color.lerp(fogColorTarget, lerpSpeed);
    scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, fogNearTarget, lerpSpeed);
    ambientLight.color.lerp(ambientColorTarget, lerpSpeed);
    glassMat.emissiveIntensity = THREE.MathUtils.lerp(glassMat.emissiveIntensity, windowGlowTarget, lerpSpeed);
    ```

---

## 5. Hoạt cảnh Lập trình (Procedural Animations & Physics Math)
*   **Gate Swing (Cánh cổng xoay)**:
    *   Thay vì xoay mesh từ tâm, hai cánh cổng gỗ được đặt vào hai nhóm pivot (`THREE.Group`) nằm ở hai cột trụ bên rìa ngoài.
    *   Tịnh tiến mesh cánh cổng lệch đi một khoảng bằng một nửa chiều rộng để trục xoay nằm đúng bản lề (hinge).
    *   Xoay góc khớp bản lề bằng giải thuật lerp góc xoay quanh trục Y:
        $$\theta_{\text{hiện tại}} = \text{lerp}(\theta_{\text{hiện tại}}, \theta_{\text{mục tiêu}}, \Delta t \times 3.0)$$
*   **Sea Wave & Foam (Sóng và bọt biển)**:
    *   Sử dụng toán học lượng giác 2 chiều biến đổi trực tiếp thuộc tính tọa độ Y của các đỉnh trên lưới bề mặt (`seaGeo` và `foamGeo`):
        $$y = y_{\text{gốc}} + \sin(x \times 0.04 + t \times 0.0018) \times \cos(z \times 0.04 + t \times 0.0018) \times 1.3$$
    *   Mặt bọt biển (foam layer) có tần số và biên độ lệch pha nhẹ so với mặt nước để tạo chuyển động trượt bọt tự nhiên. Sau mỗi lần cập nhật đỉnh, gọi hàm `computeVertexNormals()` để tính toán lại pháp tuyến mặt phẳng đa giác phục vụ đổ bóng chính xác.
*   **Starfield & Twinkle (Bầu trời sao & Nhấp nháy)**:
    *   Tự động sinh ngẫu nhiên 600 ngôi sao phân bổ đều trên hình bán cầu lớn bao bọc bầu trời.
    *   Opactiy của sao lerp về 0 vào ban ngày và tăng lên `0.95` vào ban đêm.
    *   Ngôi sao nhấp nháy nhịp nhàng bằng cách thay đổi thuộc tính kích cỡ điểm (`size`) theo hàm sin:
        $$\text{size} = 1.6 + \sin(t \times 0.006) \times 0.6$$

---

## 6. Kỹ thuật Tối ưu Hiệu năng (Performance Optimization)
*   **InstancedMesh (Vẽ phiên bản hàng loạt)**:
    *   Áp dụng cho rừng thông (200 cây) và cây tán lá rộng (120 cây) xung quanh trang trại.
    *   Thay vì tạo ra hàng trăm mesh độc lập (gây nghẽn cổ chai CPU-GPU do số lượng lệnh vẽ Draw Calls quá nhiều), hệ thống chỉ sử dụng một lệnh vẽ duy nhất cho mỗi phần thân cây/lá cây bằng cách truyền một ma trận chuyển đổi hình học (`Matrix4`) cấu hình vị trí, xoay, tỉ lệ scale của từng cây vào `InstancedMesh`.
*   **Khớp chiều cao với địa hình thế giới (Terrain Alignment)**:
    *   Tất cả các vị trí cây cối, hàng rào, công trình đều được truy vấn thông qua hàm toán học tính toán độ cao địa hình `getTerrainHeight(x, z)`. Kỹ thuật này giúp loại bỏ hoàn toàn các thuật toán dò tìm đắt đỏ bằng Raycasting trên CPU trong luồng chạy chính.
