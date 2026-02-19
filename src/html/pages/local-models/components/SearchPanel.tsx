import { Button, Form, Input, notification, Select, Space } from "antd";
import type { DefaultOptionType } from "antd/es/select";
import { debounce } from "es-toolkit";
import type { PrimitiveAtom } from "jotai";
import { useAtom } from "jotai";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import {
	BaseModelsArray,
	CheckpointTypeArray,
	ModelsRequestPeriodArray,
	ModelsRequestSortArray,
	ModelTypesArray,
} from "../../../../civitai-api/v1/models/base-models/misc";
import type { ModelsRequestOptions } from "../../../../civitai-api/v1/models/models";
import { edenTreaty } from "../../../utils";

interface SearchPanelProps {
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
	searchOptsAtom: PrimitiveAtom<ModelsRequestOptions>;
}

export function SearchPanel({
	setIsModalOpen,
	searchOptsAtom,
}: SearchPanelProps) {
	const [searchOpt, setSearchOpt] = useAtom(searchOptsAtom);
	const [form] = Form.useForm<ModelsRequestOptions>();
	const [tagsOptions, setTagsOptions] = useState<Array<DefaultOptionType>>([]);

	async function asyncSearchTags(keyword: string) {
		function toOptionsArray(params: Array<string>): Array<DefaultOptionType> {
			return params.map((tag) => ({
				label: tag,
				value: tag,
			}));
		}
		const response = await edenTreaty.db.tags.get({
			query: { tagKeyword: keyword },
		});
		switch (response.status) {
			case 200:
				if (response.data) {
					setTagsOptions(toOptionsArray(response.data));
				} else {
					setTagsOptions([]);
				}
				break;
			case 422:
				notification.error({ title: "Invalid HTTP QueryString" });
				setTagsOptions([]);
				break;
			default:
				notification.error({ title: "Failed to fetch tags" });
				setTagsOptions([]);
				break;
		}
	}
	const debouncedSearchTags = debounce(asyncSearchTags, 600);
	useEffect(() => {
		form.setFieldsValue(searchOpt);
	});

	return (
		<Form
			layout="horizontal"
			form={form}
			onSubmitCapture={() => {
				setSearchOpt(form.getFieldsValue());
				setIsModalOpen(false);
			}}
		>
			<Form.Item name="query" label="Query Text">
				<Input
					placeholder="input search text"
					value={form.getFieldValue("query")}
					onChange={(e) => {
						form.setFieldValue("query", e.target.value);
					}}
				/>
			</Form.Item>
			<Form.Item name="username" label="Username">
				<Input
					placeholder="input username"
					value={form.getFieldValue("username")}
					onChange={(e) => {
						form.setFieldValue("username", e.target.value);
					}}
				/>
			</Form.Item>
			<Form.Item name="baseModels" label="Base Model Select">
				<Select
					mode="multiple"
					options={BaseModelsArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Base model"
					value={searchOpt.baseModels}
					onChange={(value) => {
						form.setFieldValue("baseModels", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="types" label="Model Type">
				<Select
					mode="multiple"
					options={ModelTypesArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Model Type"
					value={form.getFieldValue("types")}
					onChange={(value) => {
						form.setFieldValue("types", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="checkpointType" label="Checkpoint Type">
				<Select
					options={CheckpointTypeArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Checkpoint Type"
					value={form.getFieldValue("checkpointType")}
					onChange={(value) => {
						form.setFieldValue("checkpointType", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="period" label="Period">
				<Select
					options={ModelsRequestPeriodArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Period"
					value={form.getFieldValue("period")}
					onChange={(value) => {
						form.setFieldValue("period", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="sort" label="Sort">
				<Select
					options={ModelsRequestSortArray.map<DefaultOptionType>((v) => ({
						label: v,
						value: v,
					}))}
					placeholder="Sort"
					value={form.getFieldValue("sort")}
					onChange={(value) => {
						form.setFieldValue("sort", value);
					}}
				/>
			</Form.Item>
			<Form.Item name="tag" label="Tags">
				<Select
					mode="multiple"
					placeholder="Tags"
					value={form.getFieldValue("tag")}
					onChange={(value) => {
						form.setFieldValue("tag", value);
					}}
					showSearch={{
						onSearch: (value) => debouncedSearchTags(value),
						autoClearSearchValue: false,
					}}
					options={tagsOptions}
				/>
			</Form.Item>
			<Form.Item>
				<Space>
					<Button type="primary" htmlType="submit">
						Search
					</Button>
					<Button onClick={() => setSearchOpt({})}>Reset</Button>
				</Space>
			</Form.Item>
		</Form>
	);
}
