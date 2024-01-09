import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@educandu/educandu/components/icons/general/delete-icon.js";
import MoveUpIcon from "@educandu/educandu/components/icons/general/move-up-icon.js";
import MoveDownIcon from "@educandu/educandu/components/icons/general/move-down-icon.js";
function CSVLabel({
  index,
  children,
  onMoveUp,
  onDelete,
  isDragged,
  itemsCount,
  onMoveDown,
  arrayLength,
  isOtherDragged,
  dragHandleProps,
  canDeleteLastItem,
  extraActionButtons,
  onExtraActionButtonClick
}) {
  const { t } = useTranslation();
  const handleActionButtonWrapperClick = (event, actionButton) => {
    if (actionButton.disabled) {
      event.stopPropagation();
    }
  };
  const handleActionButtonClick = (event, actionButton) => {
    event.stopPropagation();
    switch (actionButton.key) {
      case "moveUp":
        return onMoveUp(index);
      case "moveDown":
        return onMoveDown(index);
      case "delete":
        return onDelete(index);
      default:
        return onExtraActionButtonClick(actionButton.key);
    }
  };
  const actionButtons = [];
  if (onMoveUp) {
    actionButtons.push({
      key: "moveUp",
      title: null,
      icon: /* @__PURE__ */ React.createElement(MoveUpIcon, null),
      disabled: index === 0
    });
  }
  if (onMoveDown) {
    actionButtons.push({
      key: "moveDown",
      title: null,
      icon: /* @__PURE__ */ React.createElement(MoveDownIcon, null),
      disabled: index === itemsCount - 1
    });
  }
  if (onDelete) {
    const isDeleteDisabled = !canDeleteLastItem && itemsCount <= 1;
    actionButtons.push({
      key: "delete",
      title: t("common:delete"),
      icon: /* @__PURE__ */ React.createElement(DeleteIcon, null),
      danger: !isDeleteDisabled,
      disabled: isDeleteDisabled
    });
  }
  actionButtons.push(...extraActionButtons);
  const renderActionButtons = () => {
    if (!actionButtons.length) {
      return null;
    }
    return /* @__PURE__ */ React.createElement("div", { className: "ItemPanel-actionButtons", style: { width: "fit-content", marginLeft: "0.8rem" } }, actionButtons.map((actionButton) => /* @__PURE__ */ React.createElement("div", { key: actionButton.key, onClick: (event) => handleActionButtonWrapperClick(event, actionButton) }, /* @__PURE__ */ React.createElement(Tooltip, { title: actionButton.title }, /* @__PURE__ */ React.createElement(
      Button,
      {
        type: "text",
        size: "small",
        icon: actionButton.icon,
        disabled: actionButton.disabled,
        className: classNames("u-action-button", { "u-danger-action-button": actionButton.danger }),
        onClick: (event) => handleActionButtonClick(event, actionButton)
      }
    )))));
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { marginBottom: index < arrayLength - 1 ? "-0.3rem" : "1rem" },
      ...dragHandleProps,
      className: classNames("ItemPanel", "List-TemplateItem", { "is-dragged": isDragged, "is-other-dragged": isOtherDragged })
    },
    children,
    /* @__PURE__ */ React.createElement("div", null, renderActionButtons())
  );
}
CSVLabel.propTypes = {
  arrayLength: PropTypes.number.isRequired,
  canDeleteLastItem: PropTypes.bool,
  children: PropTypes.node.isRequired,
  extraActionButtons: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.node,
    danger: PropTypes.bool,
    disabled: PropTypes.bool
  })),
  header: PropTypes.string,
  index: PropTypes.number,
  dragHandleProps: PropTypes.object,
  isDragged: PropTypes.bool,
  isOtherDragged: PropTypes.bool,
  itemsCount: PropTypes.number,
  onDelete: PropTypes.func,
  onExtraActionButtonClick: PropTypes.func,
  onMoveDown: PropTypes.func,
  onMoveUp: PropTypes.func
};
CSVLabel.defaultProps = {
  canDeleteLastItem: false,
  extraActionButtons: [],
  header: "",
  index: 0,
  dragHandleProps: null,
  isDragged: false,
  isOtherDragged: false,
  itemsCount: 1,
  onDelete: null,
  onExtraActionButtonClick: () => {
  },
  onMoveDown: null,
  onMoveUp: null
};
var csv_label_default = CSVLabel;
export {
  csv_label_default as default
};
//# sourceMappingURL=csv-label.js.map
