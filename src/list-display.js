import { Input, Tag } from 'antd';
import ListItem from './list-item.js';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect } from 'react';
import uniqueId from '@educandu/educandu/utils/unique-id.js';
import cloneDeep from '@educandu/educandu/utils/clone-deep.js';
import { sectionDisplayProps } from '@educandu/educandu/ui/default-prop-types.js';

const { CheckableTag } = Tag;

export default function ListDisplay({ content }) {

  const inputRef = useRef(null);
  const { t } = useTranslation('benewagner/educandu-plugin-list');
  const archivedByBSB = t('archivedByBSB');
  // const { csvData, customLabels, isCC0Music, listName, renderSearch } = content;
  // const { csvData, isCC0Music, listName, renderSearch } = content;
  const { csvData, listName, renderSearch } = content;
  const isCC0Music = csvData[0].includes('bsb-url-1');
  const customLabels = csvData?.[0];
  const tagsData = customLabels.filter(tag => !tag.includes('track-url-') && !tag.includes('bsb-url-'));

  const filteredDataElemIndices = useRef([]);

  const customLabelsIndices = {};
  for (let i = 0; i < customLabels.length; i += 1) {
    customLabelsIndices[customLabels[i]] = i;
  }

  const getInitialCsvDisplayData = () => {
    const data = cloneDeep(csvData);
    data.shift();
    return data;
  };

  const [isFiltered, setIsFiltered] = useState(false);
  const firstTrackDataIndex = csvData[0].findIndex(elem => elem.includes('track-title-'));
  const unfilteredCsvDataRef = useRef(getInitialCsvDisplayData());

  const [selectedTags, setSelectedTags] = useState(() => {
    const arr = cloneDeep(tagsData);
    if (tagsData.find(tag => tag.includes('track-title-'))) {
      arr.push(t('trackTitle'));
    }
    return arr;
  });
  const [displayCsvData, setDisplayCsvData] = useState(cloneDeep(unfilteredCsvDataRef.current));

  const areSetsEqual = (set1, set2) => {
    if (set1.size !== set2.size) {
      return false;
    }
    for (const value of set1) {
      if (!set2.has(value)) {
        return false;
      }
    }
    return true;
  };

  const filterData = string => {
    filteredDataElemIndices.current = [];
    const inputText = string.trim().replace(/\s+/g, ' ').toLowerCase();
    const values = inputText.split(' ');
    const valuesSet = new Set(values);
    if (inputText.length > 2) {
      const newData = unfilteredCsvDataRef.current.filter((item, index) => {
        const foundValuesSet = new Set();
        for (const value of values) {
          for (const tag of selectedTags) {
            if (item[customLabelsIndices[tag]]?.toLowerCase().includes(value)) {
              foundValuesSet.add(value);
              if (areSetsEqual(valuesSet, foundValuesSet)) {
                filteredDataElemIndices.current.push(index);
                return true;
              }
            }
          }
        }
        return false;
      });
      setDisplayCsvData(newData);
      setIsFiltered(true);
    } else if (isFiltered) {
      setDisplayCsvData(unfilteredCsvDataRef.current);
      setIsFiltered(false);
    }
  };

  const handleChange = (tag, checked) => {

    if (tag === t('trackTitle')) {
      const trackTitleTags = tagsData.filter(elem => elem.includes('track-title-'));
      let nextSelectedTags = checked
        ? [...selectedTags, ...trackTitleTags]
        : selectedTags.filter(tagElem => !trackTitleTags.includes(tagElem));
      checked ? nextSelectedTags.push(t('trackTitle')) : nextSelectedTags = nextSelectedTags.filter(elem => elem !== t('trackTitle'));
      setSelectedTags(nextSelectedTags);
      return;
    }

    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter(tagElem => tagElem !== tag);
    setSelectedTags(nextSelectedTags);
  };

  const renderSearchBar = () => (
    <React.Fragment>
      <div>{`${t('searchWithin')}:`}</div>
      <div className="List-checkableTags">
        {tagsData.filter(tag => !tag.includes('track-title-')).map((tag, index) => (
          <CheckableTag
            key={tag + index}
            checked={selectedTags.includes(tag)}
            onChange={checked => handleChange(tag, checked)}
          >
            {tag}
          </CheckableTag>
        ))}
        {tagsData.find(tag => tag.includes('track-title-'))
          ? <CheckableTag
            checked={selectedTags.includes(t('trackTitle'))}
            onChange={checked => handleChange(t('trackTitle'), checked)}
          >
            {t('trackTitle')}
          </CheckableTag>
          : null}
      </div>
      <Input ref={inputRef} onChange={e => filterData(e.target.value)} allowClear style={{ maxWidth: '300px' }} />
    </React.Fragment>
  );

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }
    filterData(inputRef.current.input.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags]);

  return (
    <div className="List-Display">
      {listName !== '' ? <h1>{listName}</h1> : null}
      {renderSearch ? renderSearchBar() : null}
      <div>
        {displayCsvData.map((arr, index) => <ListItem key={uniqueId.create()} itemArray={arr} customLabels={customLabels} isCC0Music={isCC0Music} firstTrackDataIndex={firstTrackDataIndex} archivedByBSB={archivedByBSB} index={isFiltered ? filteredDataElemIndices.current[index] : index} />)}
      </div>
    </div>
  );
}

ListDisplay.propTypes = {
  ...sectionDisplayProps
};
