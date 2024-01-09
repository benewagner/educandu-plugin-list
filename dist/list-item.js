import PropTypes from "prop-types";
import React, { useState } from "react";
function ListItem({ itemArray, isCC0Music, customLabels, firstTrackDataIndex, archivedByBSB }) {
  const [isClicked, setIsClicked] = useState(false);
  const renderTracks = () => {
    if (!firstTrackDataIndex) {
      return null;
    }
    const tracksArray = [];
    for (let i = firstTrackDataIndex; i < itemArray.length; i += 3) {
      tracksArray.push(/* @__PURE__ */ React.createElement("div", { key: Math.random(), style: { marginBottom: "1rem", display: "flex", flexDirection: "column", alignItems: "center", width: "fit-content" } }, /* @__PURE__ */ React.createElement("audio", { style: { height: "40px" }, preload: "none", controls: true, src: itemArray[i + 2] }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "bold" } }, itemArray[i]), itemArray[i + 1] !== "" ? /* @__PURE__ */ React.createElement("div", null, `${archivedByBSB}: `, /* @__PURE__ */ React.createElement("a", { href: itemArray[i + 1] }, "Link")) : null));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "List-Track" }, tracksArray);
  };
  const renderInfos = () => /* @__PURE__ */ React.createElement("div", { className: "List-listItemInfos" }, /* @__PURE__ */ React.createElement("ul", { style: { listStyle: "none" } }, customLabels.map((label, i) => i > 0 && itemArray[i] !== "" ? /* @__PURE__ */ React.createElement("li", { key: `${itemArray[0]}-${i}` }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "bold" } }, `${label}: `), itemArray[i]) : null)), isCC0Music ? renderTracks() : null);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "List-listItem", style: { backgroundColor: isClicked ? "hsl(0, 0%, 94%)" : "white" }, onClick: () => setIsClicked(!isClicked) }, itemArray[0]), isClicked ? renderInfos() : null);
}
var list_item_default = ListItem;
ListItem.propTypes = {
  archivedByBSB: PropTypes.string.isRequired,
  itemArray: PropTypes.array.isRequired,
  isCC0Music: PropTypes.bool.isRequired,
  customLabels: PropTypes.array.isRequired,
  firstTrackDataIndex: PropTypes.number
};
ListItem.defaultProps = {
  firstTrackDataIndex: -1
};
export {
  list_item_default as default
};
//# sourceMappingURL=list-item.js.map
