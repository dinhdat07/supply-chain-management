# Feature: Risk Agent & Control Tower Polish

## Goal
Cải thiện toàn diện UX/UI của trang Control Tower (Dashboard) để trở thành công cụ hỗ trợ ra quyết định vận hành hiệu quả hơn, hiển thị theo thời gian thực (real-time) tiến trình xử lý của AI Agents và tối ưu hóa luồng giao diện người dùng (giảm tải nhận thức, gom nhóm thông tin, làm rõ quy trình).

## Accomplished
- **Real-time Trace Updates**: Tích hợp cơ chế polling 500ms ở frontend (`useControlTower.ts`) kết hợp với `trace_updater` callback ở backend để liên tục cập nhật state của graph.
- **Planned Roadmap UX**: Cập nhật danh sách Planned Roadmap, giới hạn chiều cao hiển thị (`max-h-[500px]`) và thêm chức năng mở rộng/thu gọn (Compact/Expanded), mặc định hiển thị top 8 item.
- **Codebase Cleanup**: Gỡ bỏ các component trùng lặp và không cần thiết như `AgentTimeline` (đã có ở Plan Generation) và `ScenarioLab`, giúp luồng component `Agent.tsx` gọn gàng hơn.
- **Exception Queue Modal**: Chuyển đổi Exception Queue thành giao diện Popup Modal chuyên nghiệp (hỗ trợ tính năng search, filter All/Critical, lock scroll, và nhấn phím `Esc` để đóng).
- **Operator Workflow Stepper**: Tái thiết kế toàn bộ `WorkflowSection.tsx` từ dạng grid các nút thành một Stepper workflow trực quan, giúp người dùng dễ dàng theo dõi trình tự và tiến độ các bước.
- **KPI Grouping**: Cải thiện Information Hierarchy bằng cách phân nhóm rõ ràng các chỉ số KPI trong `OperationsConsole.tsx` thành 3 nhóm cốt lõi: Performance, Risk, và Cost & Efficiency.
- **Decision Flow Layout**: Chuyển đổi nửa dưới của Control Tower từ một bảng dữ liệu khô khan thành một luồng "Decision Flow" trực quan với 6 phần rõ ràng: 
  1. **Decision**: So sánh các Candidate Plans, hiển thị rõ lựa chọn đề xuất và tóm tắt lý do.
  2. **Impact**: Đánh giá Projected Impact (Before vs After) với các KPI cốt lõi.
  3. **Execution**: Planned Roadmap hiển thị top các hành động cần thực thi.
  4. **Risks & Constraints**: Nhóm các Alert/Constraints theo mức độ nghiêm trọng (Critical, Warning, Info) với khả năng mở rộng/thu gọn.
  5. **Context**: Lịch sử các case tương tự (Historical Context).
  6. **Learning**: Ghi chú Reflection Memory từ các lần ra quyết định trước.

## Next Steps (UX Review)
- Rà soát kiểm tra contrast/spacing, thêm các hiệu ứng micro-interactions (hover, active states).
- Nghiên cứu và bổ sung sticky action bar cho các thao tác chính.