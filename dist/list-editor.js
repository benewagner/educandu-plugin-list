import Papa from "papaparse";
import jschardet from "jschardet";
import CSVLabel from "./csv-label.js";
import { useTranslation } from "react-i18next";
import Logger from "@educandu/educandu/common/logger.js";
import cloneDeep from "@educandu/educandu/utils/clone-deep.js";
import React, { useRef, useId, useEffect, useState } from "react";
import { Form, Upload, Button, Input, Divider, Switch } from "antd";
import { FORM_ITEM_LAYOUT } from "@educandu/educandu/domain/constants.js";
import { CloudUploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { sectionEditorProps } from "@educandu/educandu/ui/default-prop-types.js";
import DragAndDropContainer from "@educandu/educandu/components/drag-and-drop-container.js";
import { swapItemsAt, removeItemAt, moveItem } from "@educandu/educandu/utils/array-utils.js";
const { Dragger } = Upload;
const logger = new Logger(import.meta.url);
function ListEditor({ content, onContentChanged }) {
  const droppableIdRef = useRef(useId());
  const { t } = useTranslation("benewagner/educandu-plugin-list");
  const [isCheckBoxChanged, setIsCheckboxChanged] = useState(false);
  const { listName, csvData, isCC0Music, customLabels, renderSearch } = content;
  const FormItem = Form.Item;
  const encodingRef = useRef(null);
  const filterRegex = /^(?:track|bsbLink|hmtLink)-[1-9]\d?$/;
  const updateContent = (newContentValues) => {
    onContentChanged({ ...content, ...newContentValues });
  };
  const customRequest = ({ file, onSuccess }) => {
    Papa.parse(file, {
      encoding: encodingRef.current,
      complete: (result) => {
        const displayData = cloneDeep(result.data);
        if (displayData[0].length === 1) {
          displayData.indexOf(";") ? displayData[0] = displayData[0][0].split(";") : displayData.shift();
        }
        const csvDataLabels = displayData.shift();
        displayData.sort((a, b) => a[0].localeCompare(b[0]));
        displayData.splice(0, 0, csvDataLabels);
        const newCustomLabels = isCC0Music ? displayData[0].filter((label) => !filterRegex.test(label)) : displayData[0];
        updateContent({ csvData: displayData, customLabels: newCustomLabels });
        onSuccess();
      },
      error: (error) => {
        logger.error(error);
      },
      skipEmptyLines: true
    });
  };
  const props = {
    name: "file",
    maxCount: 1,
    // Detect encoding of csv file. Prevents upload if no encoding is identified. If identified, pass encoding to papaparse in customRequest.
    beforeUpload: (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csvResult = event.target.result.split(/\r|\n|\r\n/);
          try {
            encodingRef.current = jschardet.detect(csvResult.toString()).encoding;
            resolve();
          } catch (error) {
            logger.error(error);
            reject(error);
          }
        };
        reader.readAsBinaryString(file);
      });
    },
    customRequest,
    onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        logger.info(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        logger.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      const filename = e.dataTransfer.files[0].name;
      const extensionIndex = filename.lastIndexOf(".");
      const filenameWithoutExtension = filename.substring(0, extensionIndex);
      updateContent({ listName: filenameWithoutExtension });
    }
  };
  const handleListNameChanged = (event) => updateContent({ listName: event.target.value });
  const handleLabelChanged = (event, index) => {
    const { value } = event.target;
    const newCustomLabels = cloneDeep(customLabels);
    newCustomLabels[index] = value;
    updateContent({ customLabels: newCustomLabels });
  };
  const handleMoveLabelUp = (index) => {
    const newCsvData = csvData.map((row) => swapItemsAt(row, index, index - 1));
    const newCustomLabels = swapItemsAt(customLabels, index, index - 1);
    updateContent({ csvData: newCsvData, customLabels: newCustomLabels });
  };
  const handleMoveLabelDown = (index) => {
    const newCsvData = csvData.map((row) => swapItemsAt(row, index, index + 1));
    const newCustomLabels = swapItemsAt(customLabels, index, index + 1);
    updateContent({ csvData: newCsvData, customLabels: newCustomLabels });
  };
  const handleDeleteLabel = (index) => {
    const newCsvData = csvData.map((row) => removeItemAt(row, index));
    const newCustomLabels = removeItemAt(customLabels, index);
    updateContent({ csvData: newCsvData, customLabels: newCustomLabels });
  };
  const handleMoveLabel = (fromIndex, toIndex) => {
    const displayData = csvData.map((row) => moveItem(row, fromIndex, toIndex));
    const newCustomLabels = moveItem(customLabels, fromIndex, toIndex);
    const lastRow = displayData[displayData.length - 1];
    lastRow.length === 1 && lastRow[0] === "" ? displayData.splice(-1, 1) : null;
    const csvDataLabels = displayData.shift();
    displayData.sort((a, b) => a[0].localeCompare(b[0]));
    displayData.splice(0, 0, csvDataLabels);
    updateContent({ csvData: displayData, customLabels: newCustomLabels });
  };
  const handleUpdateCC0MusicChanged = (e) => {
    updateContent({ isCC0Music: e });
    setIsCheckboxChanged(true);
  };
  const downloadCSV = () => {
    if (!window) {
      return;
    }
    const newCsvData = cloneDeep(csvData);
    for (let i = 0; i < customLabels.length - 1; i += 1) {
      newCsvData[0][i] = customLabels[i];
    }
    const csv = `${Papa.unparse(newCsvData, { delimiter: "," })}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const blobURL = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobURL;
    link.download = listName !== "" && listName.length > 1 ? `${listName}.csv` : `${t("list")}.csv`;
    link.click();
    window.URL.revokeObjectURL(blobURL);
  };
  const renderCsvData = ({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength }) => {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      CSVLabel,
      {
        key: label,
        index,
        arrayLength,
        isDragged,
        isOtherDragged,
        dragHandleProps,
        onMoveUp: handleMoveLabelUp,
        onMoveDown: handleMoveLabelDown,
        onDelete: handleDeleteLabel,
        itemsCount: customLabels.length
      },
      /* @__PURE__ */ React.createElement("div", { className: "List-ListListList", style: { display: "flex", alignItems: "center", width: "100%", maxWidth: "900px", padding: "0.5rem 0" } }, /* @__PURE__ */ React.createElement("div", { style: { margin: "0 1rem 0 2rem", width: "100%", maxWidth: "154px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, label !== "" ? `${label}:` : `[${t("new")}]:`), /* @__PURE__ */ React.createElement(Input, { value: customLabels[index], onChange: (e) => handleLabelChanged(e, index) }))
    ), index === 0 ? /* @__PURE__ */ React.createElement(Divider, { plain: true }, t("foldOutContent")) : null);
  };
  const getDragAndDropListItems = () => csvData[0]?.map((label, index) => ({
    key: label !== "" ? label : `new-label-${index}`,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => renderCsvData({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength: customLabels.length })
  })).filter((elem) => isCC0Music ? !filterRegex.test(elem.key) : true);
  const dragAndDropLabels = getDragAndDropListItems();
  useEffect(() => {
    if (!isCheckBoxChanged) {
      return;
    }
    const newCustomLabels = isCC0Music ? csvData[0].filter((label) => !filterRegex.test(label)) : csvData[0];
    updateContent({ customLabels: newCustomLabels });
  }, [isCC0Music, isCheckBoxChanged]);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Form, { labelAlign: "left" }, /* @__PURE__ */ React.createElement(FormItem, { label: t("listName"), ...FORM_ITEM_LAYOUT }, /* @__PURE__ */ React.createElement(Input, { value: listName, onChange: handleListNameChanged })), /* @__PURE__ */ React.createElement(FormItem, { label: t("csvImport"), ...FORM_ITEM_LAYOUT }, /* @__PURE__ */ React.createElement(Dragger, { ...props }, /* @__PURE__ */ React.createElement("p", { className: "ant-upload-drag-icon" }, /* @__PURE__ */ React.createElement(CloudUploadOutlined, null)), /* @__PURE__ */ React.createElement("p", { className: "ant-upload-text" }, t("uploadCsvFile")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("p", { className: "EmptyState-buttonSubtext List-buttonSubtext" }, t("dragAndDropOrClick"))))), /* @__PURE__ */ React.createElement(FormItem, { label: t("csvExport"), ...FORM_ITEM_LAYOUT }, /* @__PURE__ */ React.createElement(Button, { icon: /* @__PURE__ */ React.createElement(DownloadOutlined, null), onClick: downloadCSV }, "Download CSV")), /* @__PURE__ */ React.createElement(FormItem, { label: t("updateCC0Music"), ...FORM_ITEM_LAYOUT }, /* @__PURE__ */ React.createElement(
    Switch,
    {
      size: "small",
      checked: isCC0Music,
      onChange: handleUpdateCC0MusicChanged
    }
  )), /* @__PURE__ */ React.createElement(FormItem, { label: t("searchFunctionality"), ...FORM_ITEM_LAYOUT }, /* @__PURE__ */ React.createElement(
    Switch,
    {
      size: "small",
      checked: renderSearch,
      onChange: (e) => updateContent({ renderSearch: e })
    }
  )), csvData[0][0] ? /* @__PURE__ */ React.createElement(Divider, { plain: true }, t("display")) : null, /* @__PURE__ */ React.createElement(DragAndDropContainer, { droppableId: droppableIdRef.current, items: dragAndDropLabels, onItemMove: handleMoveLabel })));
}
ListEditor.propTypes = {
  ...sectionEditorProps
};
export {
  ListEditor as default
};
//# sourceMappingURL=list-editor.js.map
