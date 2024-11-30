import joi from 'joi';
import React from 'react';
import ListIcon from './list-icon.js';
import uniqueId from '@educandu/educandu/utils/unique-id.js';
import cloneDeep from '@educandu/educandu/utils/clone-deep.js';
import { PLUGIN_GROUP } from '@educandu/educandu/domain/constants.js';
import { couldAccessUrlFromRoom } from '@educandu/educandu/utils/source-utils.js';
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
    return [PLUGIN_GROUP.mostUsed, PLUGIN_GROUP.other];
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
      itemTemplate: {
        display: '',
        inputs: []
      },
      csvData: [[]],
      customLabels: [],
      listName: '',
      items: [],
      searchTags: [],
      isCC0Music: false,
      renderSearch: true,
      isCustomList: false
    };
  }

  validateContent(content) {
    const schema = joi.object({
      itemTemplate: joi.object(),
      listName: joi.string().allow('').required(),
      items: joi.array().required(),
      searchTags: joi.array(),
      csvData: joi.array(),
      customLabels: joi.array(),
      isCC0Music: joi.boolean().required(),
      renderSearch: joi.boolean().required(),
      isCustomList: joi.boolean()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.text = this.gfm.redactCdnResources(
      redactedContent.text,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    return redactedContent;
  }

  getCdnResources(content) {
    return this.gfm.extractCdnResources(content.text);
  }
}

export default ListInfo;
