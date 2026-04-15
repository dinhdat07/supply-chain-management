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

## Next Steps (UX Review)
- Tối ưu hóa Call-to-Action (CTA).
- Làm rõ lý do Planner đưa ra quyết định chọn plan.
- Rà soát kiểm tra contrast/spacing, thêm các hiệu ứng micro-interactions (hover, active states).
- Nghiên cứu và bổ sung sticky action bar cho các thao tác chính.
