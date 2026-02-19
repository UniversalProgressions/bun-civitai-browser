import { Pagination, type PaginationProps } from "antd";
import { useAtom } from "jotai";
import { localSearchOptionsAtom, totalAtom } from "../atoms";

export function LocalPagination() {
	const [searchOpt, setSearchOpt] = useAtom(localSearchOptionsAtom);
	const [total, _setTotal] = useAtom(totalAtom);
	const onChange: PaginationProps["onChange"] = (page, pageSize) => {
		setSearchOpt((prev) => ({ ...prev, page, limit: pageSize }));
	};
	return (
		<Pagination
			pageSize={searchOpt.limit ?? 20}
			current={searchOpt.page ?? 1}
			total={total}
			onChange={onChange}
			showSizeChanger
			showQuickJumper
			showTotal={(total) => `Total ${total} items`}
		/>
	);
}
