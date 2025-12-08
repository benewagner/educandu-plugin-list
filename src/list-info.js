import joi from 'joi';
import React from 'react';
import ListIcon from './list-icon.js';
import uniqueId from '@educandu/educandu/utils/unique-id.js';
import cloneDeep from '@educandu/educandu/utils/clone-deep.js';
import { PLUGIN_GROUP } from '@educandu/educandu/domain/constants.js';
// import { couldAccessUrlFromRoom } from '@educandu/educandu/utils/source-utils.js';
import GithubFlavoredMarkdown from '@educandu/educandu/common/github-flavored-markdown.js';

class ListInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'benewagner/educandu-plugin-list';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('benewagner/educandu-plugin-list:name');
  }

  getIcon() {
    return <ListIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.other];
  }

  async resolveDisplayComponent() {
    return (await import('./list-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./list-editor.js')).default;
  }

  getItemTemplateInputTemplate() {
    return {
      key: uniqueId.create(),
      label: '',
      value: ''
    };
  }

  getDefaultContent() {
    return {
      csvData: [[]],
      listName: '',
      renderSearch: true
    };
  }

  validateContent(content) {
    const schema = joi.object({
      csvData: joi.array().required(),
      renderSearch: joi.boolean().required(),
      listName: joi.string().allow('').required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content) {
    const redactedContent = cloneDeep(content);
    return redactedContent;
  }

  getCdnResources(content) {
    const headers = content.csvData[0];
    console.log(content.csvData[1])
    const items = cloneDeep(content.csvData.slice(1));
    const cdnUrlIndices = headers.map((header, index) => header.startsWith('track-url-') ? index : false).filter(item => item);
    const cdnResources = [];
    for (const item of items) {
      for (const index of cdnUrlIndices) {
        if (item[index]){
          item[index] = `![](${item[index]})`;
          cdnResources.push(item[index]);
        }
      }
    }
    return this.gfm.extractCdnResources(cdnResources.join(' '));
  }
}

export default ListInfo;
