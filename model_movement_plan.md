# Kế hoạch Thiết kế và Hoạt ảnh cho 10 Cây trồng Nông nghiệp 3D

Tài liệu này chi tiết hóa cấu trúc hình học, vật liệu màu sắc, cấu trúc phân cấp (hierarchy) và quy tắc hoạt ảnh cho 10 cây trồng sẽ được sinh tự động bằng Node.js + Three.js (`generate_models.js`) và nạp động vào ứng dụng Viewer (`js/viewer.js`).

---

## 1. Nguyên tắc Đặt tên Nhóm và Hoạt ảnh Chung (Generic Animation Rules)
Để mọi mô hình cây trồng đều có thể được tự động nhận diện và đung đưa mượt mà trong viewer mà không cần cấu hình thủ công từng loại, chúng ta thiết lập nguyên tắc sau:
- **Tên nhóm đung đưa (Sway Group)**: Mọi phần tán lá, nhánh quả, ngọn cây cần đung đưa sẽ được bọc chung trong một Group hoặc Mesh mang tên bắt đầu bằng `sway_group`.
- **Cơ chế hoạt ảnh trong Viewer**:
  - Khi tải bất kỳ mô hình nào (kể cả xem đơn lẻ hoặc trên bản đồ), viewer sẽ duyệt qua cây thư mục mô hình.
  - Nếu phát hiện nút có tên chứa `sway_group`, viewer sẽ đưa nút đó và vị trí của nó vào danh sách hoạt ảnh.
  - Vòng lặp render sẽ tác dụng phép xoay hình sin/cos nhỏ trên trục X và Z với độ lệch pha (phase shift) dựa vào tọa độ thế giới (hoặc chỉ số ngẫu nhiên nếu chạy đơn lẻ) để đung đưa tự nhiên theo gió.

---

## 2. Thiết kế Chi tiết cho 10 Cây trồng (Crops)

Dưới đây là thiết kế hình học low-poly cho 10 loại cây trồng. Tất cả đều được trồng trong một chiếc chậu đất nung (Terracotta Pot) có đất mùn và trang trí sỏi để đồng bộ với phong cách mô hình:

### 1. Corn Crop (Cây Ngô - `corn.glb`)
*   **Thân**: Cylinder dài, phân đoạn, màu xanh lục đậm (`0x27ae60`).
*   **Lá**: Box/Cone uốn cong ghép từ 3 phân đoạn chĩa ra ngoài và cụp xuống, màu xanh lục sáng (`0x2ecc71`).
*   **Bắp ngô**: Lõi Cone màu vàng hạt (`0xf1c40f`), bọc vỏ xanh mạ (`0xa2d149`) hé mở, râu ngô màu cam úa (`0xe67e22`) ở đỉnh.
*   **Nhóm hoạt ảnh**: `sway_group` bao gồm thân cây, lá và các bắp ngô (phần trên miệng chậu).

### 2. Rice Crop (Lúa Nước - `rice.glb`)
*   **Thân**: Cụm Cylinder mảnh chụm ở gốc và xòe nhẹ ở ngọn, màu xanh lúa non (`0x2ecc71`).
*   **Bông lúa**: Các nhánh Cone nhỏ xếp tầng uốn cong nghiêng hẳn sang một bên, chứa các hạt lúa nhỏ màu vàng óng (`0xf1c40f`).
*   **Nhóm hoạt ảnh**: `sway_group` bọc cụm thân và bông lúa rủ xuống.

### 3. Carrot Crop (Cây Cà rốt - `carrot.glb`)
*   **Củ cà rốt**: Cylinder/Cone nằm dưới đất nhú lên một nửa, màu cam đậm (`0xe67e22`), có các lằn ngang xám nhẹ.
*   **Lá ngọn**: Các chùm lá kép răng cưa nhỏ ghép từ nhiều thanh Cylinder xiên chéo, màu xanh đậm (`0x27ae60`).
*   **Nhóm hoạt ảnh**: `sway_group` bọc chùm lá ngọn phía trên mặt đất.

### 4. Tomato Crop (Cây Cà chua - `tomato.glb`)
*   **Thân & Khung đỡ**: Thân chính Cylinder mảnh màu xanh cỏ (`0x2ecc71`), quấn quanh khung tre chống đỡ chữ V hoặc vòng tròn màu gỗ (`0x8e5b3c`).
*   **Lá**: Các cụm cầu/hộp nhỏ tạo tán xum xuê (`0x27ae60`).
*   **Quả cà chua**: Các quả cầu màu đỏ chín (`0xe74c3c`) và vài quả xanh (`0x2ecc71`) treo lủng lẳng trên các nhánh.
*   **Nhóm hoạt ảnh**: `sway_group` bọc toàn bộ thân lá và quả cà chua treo trên khung đỡ.

### 5. Sunflower Crop (Hoa Hướng dương - `sunflower.glb`)
*   **Thân**: Cylinder cao, thẳng đứng, màu xanh lục (`0x27ae60`).
*   **Lá**: Hai lá to đối xứng hai bên thân, dạng dẹt hơi nghiêng dốc (`0x2ecc71`).
*   **Đầu hoa**: Đĩa nhị hoa hình trụ mỏng màu nâu đậm (`0x3e2723`), bao quanh bởi vòng cánh hoa màu vàng tươi (`0xf1c40f`) xếp chéo vòng tròn.
*   **Nhóm hoạt ảnh**: `sway_group` bọc thân hoa, lá và đầu hoa hướng về một phía.

### 6. Eggplant Crop (Cây Cà tím - `eggplant.glb`)
*   **Thân**: Thân cây phân nhánh thấp, màu xanh lục pha chút tím nhẹ (`0x27ae60` và `0x8e44ad`).
*   **Quả cà tím**: Quả hình giọt nước/Cylinder cong rủ màu tím sẫm (`0x2c3e50` hoặc `0x8e44ad`), có cuống xanh to che trên đầu quả.
*   **Nhóm hoạt ảnh**: `sway_group` bọc thân lá và các quả cà tím trĩu nặng.

### 7. Pumpkin Crop (Cây Bí ngô - `pumpkin.glb`)
*   **Quả bí**: Quả cầu lớn nằm sát đất, khía múi dọc nổi rõ, màu cam đất (`0xd35400`), cuống xanh xoắn.
*   **Dây leo**: Các đoạn Cylinder uốn lượn bò xung quanh mặt đất (`0x27ae60`).
*   **Lá**: Các lá to rộng hình ngũ giác dẹt che chở xung quanh quả (`0x2ecc71`).
*   **Nhóm hoạt ảnh**: `sway_group` bọc chùm lá ngửa lên trên mặt đất và dây leo (quả bí lớn nằm sát đất giữ nguyên).

### 8. Cabbage Crop (Bắp cải - `cabbage.glb`)
*   **Lớp lá ngoài**: Các phiến lá tròn dẹt to uốn cong nghiêng xòe ra mặt đất, màu xanh đậm (`0x1b5e20`).
*   **Lớp lá cuộn trong**: Các phiến lá ôm sát tạo thành khối cầu chặt chẽ màu xanh nhạt (`0x81c784`).
*   **Nhóm hoạt ảnh**: `sway_group` bọc các phiến lá ngoài xòe ra (đung đưa nhè nhẹ).

### 9. Chili Crop (Cây Ớt - `chili.glb`)
*   **Thân**: Thân mảnh nhiều nhánh nhỏ, màu xanh lục (`0x2ecc71`).
*   **Lá**: Lá nhỏ thon dài phân bổ đều (`0x27ae60`).
*   **Quả ớt**: Các chùm quả hình nón cong nhỏ chĩa lên trời hoặc rủ xuống, màu đỏ tươi (`0xe74c3c`) và màu xanh (`0x2ecc71`).
*   **Nhóm hoạt ảnh**: `sway_group` bọc thân, lá và chùm quả ớt.

### 10. Strawberry Crop (Dâu tây - `strawberry.glb`)
*   **Chùm lá**: Bụi lá thấp xum xuê sát mặt chậu, gồm nhiều lá ba chạc nhỏ màu xanh (`0x2ecc71`).
*   **Hoa**: Hoa nhỏ cánh trắng (`0xffffff`), nhị vàng (`0xf1c40f`).
*   **Quả dâu**: Quả hình nón nhỏ màu đỏ (`0xe74c3c`), có lốm đốm hạt vàng siêu nhỏ và cuống lá xanh trên đầu.
*   **Nhóm hoạt ảnh**: `sway_group` bọc chùm lá, hoa và các quả dâu tây rủ quanh miệng chậu.
