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
      csvData: [[]],
      listName: '',
<<<<<<< HEAD
      items: [],
      searchTags: [],
      isCC0Music: false,
      renderSearch: true,
      isCustomList: false
=======
      renderSearch: true
      // itemTemplate: {
      //   display: '',
      //   inputs: []
      // },
      // customLabels: [],
      // items: [],
      // searchTags: [],
      // isCC0Music: false,
>>>>>>> update-list
    };
  }

  validateContent(content) {
    const schema = joi.object({
<<<<<<< HEAD
      itemTemplate: joi.object(),
      listName: joi.string().allow('').required(),
      items: joi.array().required(),
      searchTags: joi.array(),
      csvData: joi.array(),
      customLabels: joi.array(),
      isCC0Music: joi.boolean().required(),
      renderSearch: joi.boolean().required(),
      isCustomList: joi.boolean()
=======
      csvData: joi.array().required(),
      renderSearch: joi.boolean().required(),
      listName: joi.string().allow('').required()
      // itemTemplate: joi.object(),
      // items: joi.array().required(),
      // searchTags: joi.array(),
      // customLabels: joi.array(),
      // isCC0Music: joi.boolean().required(),
      // isCustomList: joi.boolean()
>>>>>>> update-list
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
    return this.gfm.extractCdnResources(content.text);
  }
}

export default ListInfo;
