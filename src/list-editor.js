import Papa from 'papaparse';
import jschardet from 'jschardet';
import CSVLabel from './csv-label.js';
import { useTranslation } from 'react-i18next';
import CustomCSVLabel from './custom-csv-label.js';
import Logger from '@educandu/educandu/common/logger.js';
import uniqueId from '@educandu/educandu/utils/unique-id.js';
import cloneDeep from '@educandu/educandu/utils/clone-deep.js';
import UrlInput from '@educandu/educandu/components/url-input.js';
import React, { useRef, useId, useEffect, useState } from 'react';
import { FORM_ITEM_LAYOUT } from '@educandu/educandu/domain/constants.js';
import { sectionEditorProps } from '@educandu/educandu/ui/default-prop-types.js';
import { CloudUploadOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { Form, Upload, Button, Radio, Input, Divider, Switch, InputNumber } from 'antd';
import DragAndDropContainer from '@educandu/educandu/components/drag-and-drop-container.js';
import { swapItemsAt, removeItemAt, moveItem } from '@educandu/educandu/utils/array-utils.js';
import CustomCSVLabel from './custom-csv-label.js';

const { Dragger } = Upload;
const logger = new Logger(import.meta.url);
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function ListEditor({ content, onContentChanged }) {

  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('benewagner/educandu-plugin-list');
  // const [isCheckBoxChanged, setIsCheckboxChanged] = useState(false);
  const [isNewEntryEditActive, setIsNewEntryEditActive] = useState(false);
  // const { listName, csvData, isCC0Music, customLabels, renderSearch, hasCsvData } = content;
  // const { listName, csvData, isCC0Music, renderSearch, hasCsvData } = content;
  // const { listName, csvData, isCC0Music, renderSearch } = content;
  const { listName, csvData, renderSearch } = content;
  const isCC0Music = csvData[0].includes('bsb-url-1');

  const hasCsvData = csvData.length >= 1 && csvData[0].length > 0;

  const firstTrackDataIndex = csvData[0].findIndex(elem => elem.includes('track-title-'));

  const customLabels = csvData?.[0];

  const audioCount = customLabels.filter(label => label.includes('track-title-')).length;
  const itemToEditAudioCount = useRef(0);

  const [triggerRender, setTriggerRender] = useState(false);

  const [itemToEditIndex, setItemToEditIndex] = useState(1);

  const hasListBeenCreated = customLabels.length > 0;

  const FormItem = Form.Item;
  const encodingRef = useRef(null);
  const filterRegex = /^(?:track-title|bsb-url|track-url)-[1-9]\d?$/;

  const newItemData = useRef(customLabels.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map(() => ''));

  const getAudioTemplate = () => isCC0Music ? ['', '', '',] : ['', ''];
  const audioTemplate = getAudioTemplate();

  const customListLabelKeys = useRef([]);
  if (hasCsvData) {
    while (customLabels.length > customListLabelKeys.current.length) {
      customListLabelKeys.current.push(uniqueId.create());
    }
  }
  const newAudios = useRef([]);
  const [audioUrls, setAudioUrls] = useState([]);
  const [editorType, setEditorType] = useState('edit-list');

  const audioKeys = useRef([]);
  while (newAudios.current.length > audioKeys.current.length) {
    audioKeys.current.push(uniqueId.create());
  }

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  // customRequest also provides onError
  const customRequest = ({ file, onSuccess }) => {

    Papa.parse(file, {
      encoding: encodingRef.current,
      complete: result => {
        const displayData = cloneDeep(result.data);
        if (displayData[0].length === 1) {
          displayData.indexOf(';') ? displayData[0] = displayData[0][0].split(';') : displayData.shift();
        }
        const csvDataLabels = displayData.shift();
        displayData.sort((a, b) => a[0].localeCompare(b[0]));
        displayData.splice(0, 0, csvDataLabels);
        // const newCustomLabels = displayData[0].filter(label => !filterRegex.test(label));
        // updateContent({ csvData: displayData, customLabels: newCustomLabels });
        updateContent({ csvData: displayData });
        onSuccess();
      },
      error: error => {
        logger.error(error);
      },
      skipEmptyLines: true
    });
  };

  const props = {
    name: 'file',
    maxCount: 1,
    // Detect encoding of csv file. Prevents upload if no encoding is identified. If identified, pass encoding to papaparse in customRequest.
    beforeUpload: file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => {
          try {
            const arrayBuffer = event.target.result;

            // ArrayBuffer manuell in eine Binärzeichenkette konvertieren
            let binaryString = '';
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < bytes.length; i += 1) {
              binaryString += String.fromCharCode(bytes[i]);
            }

            // Erkennung der Kodierung mit jschardet
            const encoding = jschardet.detect(binaryString).encoding;
            encodingRef.current = encoding;
            resolve();
          } catch (error) {
            logger.error('Fehler bei der Kodierungserkennung:', error);
            reject(error);
          }
        };

        reader.readAsArrayBuffer(file);
      });
    },
    customRequest,
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        logger.info(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        logger.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      const filename = e.dataTransfer.files[0].name;
      const extensionIndex = filename.lastIndexOf('.');
      const filenameWithoutExtension = filename.substring(0, extensionIndex);
      updateContent({ listName: filenameWithoutExtension });
    }
  };

  const handleListNameChanged = event => updateContent({ listName: event.target.value });

  const handleLabelChanged = (event, index) => {
    const { value } = event.target;
    const newCustomLabels = cloneDeep(customLabels);
    newCustomLabels[index] = value;
    updateContent({ customLabels: newCustomLabels });
  };

  const handleCustomLabelChanged = (event, index) => {
    const { value } = event.target;
    const newCsvData = cloneDeep(csvData);
    const newCustomLabels = cloneDeep(customLabels);
    newCsvData[0][index] = value;
    newCustomLabels[index] = value;
    updateContent({ customLabels: newCustomLabels, csvData: newCsvData });
  };

  const handleMoveLabelUp = index => {
    const newCsvData = csvData.map(row => swapItemsAt(row, index, index - 1));
    const newCustomLabels = swapItemsAt(customLabels, index, index - 1);
    updateContent({ csvData: newCsvData, customLabels: newCustomLabels });
  };

  const handleMoveLabelDown = index => {
    const newCsvData = csvData.map(row => swapItemsAt(row, index, index + 1));
    const newCustomLabels = swapItemsAt(customLabels, index, index + 1);
    updateContent({ csvData: newCsvData, customLabels: newCustomLabels });
  };

  const handleDeleteLabel = index => {
    const newCsvData = csvData.map(row => removeItemAt(row, index));
    const newCustomLabels = removeItemAt(customLabels, index);
    updateContent({ csvData: newCsvData, customLabels: newCustomLabels });
  };

  const handleMoveLabel = (fromIndex, toIndex) => {
    const displayData = csvData.map(row => moveItem(row, fromIndex, toIndex));
    const newCustomLabels = moveItem(customLabels, fromIndex, toIndex);
    const lastRow = displayData[displayData.length - 1];
    lastRow.length === 1 && lastRow[0] === '' ? displayData.splice(-1, 1) : null;
    const csvDataLabels = displayData.shift();
    displayData.sort((a, b) => a[0].localeCompare(b[0]));
    displayData.splice(0, 0, csvDataLabels);
    updateContent({ csvData: displayData, customLabels: newCustomLabels });
  };

  // const handleUpdateCC0MusicChanged = e => {
  //   updateContent({ isCC0Music: e });
  //   setIsCheckboxChanged(true);
  // };

  const downloadCSV = () => {
    if (!window) {
      return;
    }
    const newCsvData = cloneDeep(csvData);
    for (let i = 0; i < customLabels.length - 1; i += 1) {
      newCsvData[0][i] = customLabels[i];
    }
    const csv = `${Papa.unparse(newCsvData, { delimiter: ',' })}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const blobURL = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobURL;
    link.download = listName !== '' && listName.length > 1 ? `${listName}.csv` : `${t('list')}.csv`;
    link.click();
    window.URL.revokeObjectURL(blobURL);
  };

  const renderCsvData = ({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength }) => {

    return (
      <React.Fragment>
        <CSVLabel
          key={label + index}
          index={index}
          arrayLength={arrayLength}
          isDragged={isDragged}
          isOtherDragged={isOtherDragged}
          dragHandleProps={dragHandleProps}
          onMoveUp={handleMoveLabelUp}
          onMoveDown={handleMoveLabelDown}
          onDelete={handleDeleteLabel}
          itemsCount={customLabels.length}
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '900px', padding: '0.5rem 0' }}>
            <div style={{ margin: '0 1rem 0 2rem', width: '100%', maxWidth: '154px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label !== '' ? `${label}:` : `[${t('new')}]:`}</div>
            <Input value={customLabels[index]} onChange={e => handleLabelChanged(e, index)} />
          </div>
        </CSVLabel>
        {index === 0 ? <Divider plain>{t('foldOutContent')}</Divider> : null}
      </React.Fragment>
    );
  };

  const renderCustomListCsvData = ({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength }) => {

    return (
      <React.Fragment>
        <CustomCSVLabel
          key={customListLabelKeys.current[index]}
          index={index}
          arrayLength={arrayLength}
          isDragged={isDragged}
          isOtherDragged={isOtherDragged}
          dragHandleProps={dragHandleProps}
          onMoveUp={handleMoveLabelUp}
          onMoveDown={handleMoveLabelDown}
          onDelete={handleDeleteLabel}
          itemsCount={customLabels.length}
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '900px', padding: '0.5rem 0' }}>
            <div style={{ margin: '0 1rem 0 2rem', width: '100%', maxWidth: '154px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label !== '' ? `${label}:` : `[${t('new')}]:`}</div>
            <Input
              value={customLabels[index]}
              onChange={e => handleCustomLabelChanged(e, index)}
            />
          </div>
        </CustomCSVLabel>
        {index === 0 ? <Divider plain>{t('foldOutContent')}</Divider> : null}
      </React.Fragment>
    );
  };

  const getDragAndDropListItems = () => csvData[0]?.map((label, index) => ({
    key: `new-label-${index}`,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => renderCsvData({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength: customLabels.length })
  })).filter(elem => !filterRegex.test(elem.key));

  const getDragAndDropCustomListItems = () => customLabels?.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map((label, index) => ({
    key: `new-label-${index}`,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => renderCustomListCsvData({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength: customLabels.length })
  }));

  let dragAndDropCustomListLabels = [];
  let dragAndDropLabels = [];

  if (hasCsvData) {
    dragAndDropCustomListLabels = getDragAndDropCustomListItems();
  } else {
    dragAndDropLabels = getDragAndDropListItems();
  }

  // useEffect(() => {
  //   if (!isCheckBoxChanged) {
  //     return;
  //   }
  //   const newCustomLabels = isCC0Music ? csvData[0].filter(label => !filterRegex.test(label)) : csvData[0];
  //   updateContent({ customLabels: newCustomLabels });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isCC0Music, isCheckBoxChanged]);

  // useEffect(() => {
  //   console.log(csvData);
  // }, []);

  const renderCustomListLabels = () => (
    <div>
      {csvData[0][0] ? <Divider plain>{t('display')}</Divider> : null}
      <DragAndDropContainer
        droppableId={droppableIdRef.current}
        items={dragAndDropCustomListLabels}
        onItemMove={handleMoveLabel}
      />
      <FormItem {...FORM_ITEM_LAYOUT}>
        <Button
          icon={<PlusOutlined />}
          type='primary'
          onClick={() => {
            // const newCsvData = cloneDeep(csvData);
            // newCsvData[0].push(t('newProperty'));

            const newCsvData = csvData.map((arr, index) => {
              const newValue = index === 0 ? t('newProperty') : '';
              if (firstTrackDataIndex !== -1) {
                arr.splice(firstTrackDataIndex, 0, newValue);
              } else {
                arr.push(newValue);
              }
              return arr;
            });

            // updateContent({ customLabels: [...customLabels, t('newProperty')], csvData: newCsvData });
            updateContent({ csvData: newCsvData });
          }}
        >
          {t('property')}
        </Button>
      </FormItem>
    </div>
  );

  const renderCustomListEditor = () => (
    <React.Fragment>

      {/* <Divider plain>{t('customList')}</Divider> */}

      {renderCustomListLabels()}

      <Divider plain>{t('newItem')}</Divider>

      {!isNewEntryEditActive
        ? <FormItem {...FORM_ITEM_LAYOUT}>
          <Button icon={<PlusOutlined />} type='primary' onClick={() => setIsNewEntryEditActive(true)} />
        </FormItem>
        : null}

      {isNewEntryEditActive
        ? customLabels.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map((label, index) => (
          <FormItem key={`${customListLabelKeys.current[index]}-newItem`} {...FORM_ITEM_LAYOUT} label={label}>
            <Input onChange={e => { newItemData.current[index] = e.target.value; }} />
          </FormItem>
        ))
        : null}

      {hasListBeenCreated
        ? newAudios.current.map((arr, index) => !isCC0Music
          ? (
            <div key={audioKeys.current[index]}>
              <FormItem {...FORM_ITEM_LAYOUT} label={`${t('common:title')} ${index + 1}`}><Input onChange={e => { newAudios.current[index][0] = e.target.value; }} /></FormItem>
              <FormItem {...FORM_ITEM_LAYOUT} label={`URL ${index + 1}`}>
                <UrlInput
                  value={audioUrls[index]}
                  onChange={e => {
                    newAudios.current[index][1] = e;
                    setAudioUrls(prev => {
                      const newAudioUrls = cloneDeep(prev);
                      newAudioUrls[index] = e;
                      return newAudioUrls;
                    });
                  }}
                />
              </FormItem>
            </div>
          )
          : <div key={`${audioKeys.current[index]}-CC0`}>
            <FormItem {...FORM_ITEM_LAYOUT} label={`${t('common:title')} ${index + 1}`}>
              <Input onChange={e => { newAudios.current[index][0] = e.target.value; }} />
            </FormItem>
            <FormItem {...FORM_ITEM_LAYOUT} label={`URL ${index + 1}`}>
              <UrlInput
                value={audioUrls[index]}
                onChange={e => {
                  newAudios.current[index][2] = e;
                  setAudioUrls(prev => {
                    const newAudioUrls = cloneDeep(prev);
                    newAudioUrls[index] = e;
                    return newAudioUrls;
                  });
                }}
              />
            </FormItem>
            <FormItem {...FORM_ITEM_LAYOUT} label={`BSB-URL ${index + 1}`}>
              <Input onChange={e => { newAudios.current[index][1] = e.target.value; }} />
            </FormItem>
          </div>)
        : null}
      {hasListBeenCreated && isNewEntryEditActive
        ? <React.Fragment>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            style={{ marginLeft: '32px', marginTop: '16px' }}
            onClick={() => {
              newAudios.current.push(audioTemplate);
              setTriggerRender(prev => !prev);
            }}
          >
            Audio
          </Button>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            <Button
              type="default"
              onClick={() => {
                setIsNewEntryEditActive(false);
                newAudios.current = [];
                setAudioUrls(prev => {
                  const newAudioUrls = cloneDeep(prev);
                  newAudioUrls.push('');
                  return newAudioUrls;
                });
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                console.log(newItemData.current);
                setIsNewEntryEditActive(false);

                for (const audio of newAudios.current) {
                  for (const dataString of audio) {
                    newItemData.current.push(dataString);
                  }
                }

                const newCsvData = cloneDeep(csvData);
                newCsvData.push(newItemData.current);

                const csvDataLabels = newCsvData.shift();
                newCsvData.sort((a, b) => a[0].localeCompare(b[0]));
                newCsvData.splice(0, 0, csvDataLabels);

                // newCsvData.unshift(csvDataLabels);

                if (newAudios.current.length > audioCount) {

                  const surplusAudiosCount = newAudios.current.length - audioCount;

                  for (let i = audioCount; i < audioCount + surplusAudiosCount; i += 1) {
                    newCsvData[0].push(`track-title-${i}`);
                    newCsvData[0].push(`track-url-${i}`);
                  }
                }

                newAudios.current = [];

                console.log(newItemData.current);

                updateContent({ csvData: newCsvData });
                newItemData.current = customLabels.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map(() => '');
                setAudioUrls([]);
              }}
            >
              {t('save')}
            </Button>
          </div>
        </React.Fragment>
        : null}
    </React.Fragment>
  );

  const handleItemWasEdited = (e, propertyIndex, isUrl = false) => {
    const newCsvData = cloneDeep(csvData);
    const newValue = isUrl ? e : e.target.value;
    newCsvData[itemToEditIndex][propertyIndex] = newValue;

    let firstTrackPropertyIndexWithValue;
    let lastTrackPropertyIndexWithValue;

    for (let i = 0; i < newCsvData[itemToEditIndex].length; i += 1) {

      if (newCsvData[itemToEditIndex][i] !== '' && (newCsvData[0][i].includes('track-title-') || newCsvData[0][i].includes('track-url-'))) {
        if (!firstTrackPropertyIndexWithValue) {
          firstTrackPropertyIndexWithValue = i;
        }
        lastTrackPropertyIndexWithValue = i;
      }
    }

    const spliceIndices = [];

    for (let i = firstTrackDataIndex; i < lastTrackPropertyIndexWithValue; i += 1) {
      if (newCsvData[0][i].includes('track-title-')) {
        if (!newCsvData[itemToEditIndex][i] && !newCsvData[itemToEditIndex][i + 1]) {
          if (isCC0Music && !newCsvData[itemToEditIndex][i + 2]) {
            spliceIndices.push(i);
          }
          if (!isCC0Music) {
            spliceIndices.push(i);
          }
        }
      };
    }

    for (let i = 0; i < spliceIndices.length; i += 1) {
      const index = spliceIndices[i];
      if (isCC0Music) {
        newCsvData[itemToEditIndex].splice(index, 3);
      } else {
        newCsvData[itemToEditIndex].splice(index, 2);
      }
    }

    const lastIndex = newCsvData[itemToEditIndex].length - 1;

    if (!isCC0Music) {
      if (newCsvData[itemToEditIndex][lastIndex - 1] === '' && newCsvData[itemToEditIndex][lastIndex] === '') {
        if (lastIndex - 1 >= firstTrackDataIndex) {
          newCsvData[itemToEditIndex].splice(lastIndex - 1, 2);
        }
      }
    }

    if (isCC0Music) {
      if (newCsvData[itemToEditIndex][lastIndex - 2] === '' && newCsvData[itemToEditIndex][lastIndex - 1] === '' && newCsvData[itemToEditIndex][lastIndex] === '') {
        if (lastIndex - 2 >= firstTrackDataIndex) {
          newCsvData[itemToEditIndex].splice(lastIndex - 2, 3);
        }
      }
    }

    console.log(newCsvData[itemToEditIndex]);
    updateContent({ csvData: newCsvData });
  };

  const renderItemEditor = () => (
    <React.Fragment>
      {csvData.length > 1
        ? <FormItem label={t('item')} {...FORM_ITEM_LAYOUT}>
          <InputNumber min={1} max={csvData.length - 1} value={itemToEditIndex} onChange={e => setItemToEditIndex(e)} />
        </FormItem>
        : null}
      <Divider plain>{t('editItem')}</Divider>
      {csvData.length > 1 && csvData[0].map((label, index) => {
        if (index > csvData[itemToEditIndex].length - 1) {
          return null;
        }
        if (label.includes('track-title-')) {
          if (!csvData[itemToEditIndex][index] && !csvData[itemToEditIndex][index + 1]) {
            if (isCC0Music && !csvData[itemToEditIndex][index + 2]) {
              return null;
            }
            if (!isCC0Music) {
              return null;
            }
          }
        }
        if (label.includes('bsb-url-')) {
          if (!csvData[itemToEditIndex][index] && !csvData[itemToEditIndex][index - 1] && !csvData[itemToEditIndex][index + 1]) {
            return null;
          }
        }
        if (label.includes('track-url-')) {
          if (!csvData[itemToEditIndex][index] && !csvData[itemToEditIndex][index - 1]) {
            if (isCC0Music && !csvData[itemToEditIndex][index - 2]) {
              return null;
            }
            if (!isCC0Music) {
              return null;
            }
          }
        }
        let type = label.includes('track-title-') ? 'trackTitle' : '';
        type = label.includes('track-url-') ? 'trackUrl' : type;
        type = label.includes('bsb-url-') ? 'bsbUrl' : type;
        let newLabel = label.includes('track-title-') || label.includes('track-url-') || label.includes('bsb-url-') ? t(type) : label;
        // if (newLabel !== label) {
        //   const match = csvData[itemToEditIndex][csvData[itemToEditIndex].length - 1].match(/(\d{1,3})$/);
        //   console.log(match);
        //   if (match) {
        //     // const incrementedNumber = Number(match[1]) + 1;
        //     match ? newLabel = `${newLabel} ${incrementedNumber}` : null;
        //   } else {
        //     newLabel = `${newLabel} 1`;
        //   }
        // }

        if (newLabel !== label) {
          const incrementedNumber = type === 'trackTitle' ? itemToEditAudioCount.current + 1 : itemToEditAudioCount.current;
          newLabel = `${newLabel} ${incrementedNumber}`;
        }

        if (index === 0) {
          itemToEditAudioCount.current = 0;
        }

        const isTrackTitle = label.includes('track-title-');
        const isTrackUrl = label.includes('track-url-');

        if (isTrackTitle) {
          itemToEditAudioCount.current += 1;
        }

        if (isTrackUrl) {
          return (
            <React.Fragment key={customListLabelKeys.current[index]}>
              <FormItem key={customListLabelKeys.current[index]} label={newLabel} {...FORM_ITEM_LAYOUT}><UrlInput value={csvData[itemToEditIndex][index]} onChange={e => handleItemWasEdited(e, index, true)} /></FormItem>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={customListLabelKeys.current[index]}>
            <FormItem label={newLabel} {...FORM_ITEM_LAYOUT}><Input value={csvData[itemToEditIndex][index]} onChange={e => handleItemWasEdited(e, index)} />
            </FormItem>
          </React.Fragment>
        );
      })}
      <Button
        icon={<PlusOutlined />}
        type="primary"
        style={{ marginLeft: '32px', marginTop: '16px' }}
        onClick={() => {
          const newCsvData = cloneDeep(csvData);
          const validFirstTrackDataIndex = firstTrackDataIndex || newCsvData[0].length;
          const numberOfTrackProperties = isCC0Music ? 3 : 2;
          newCsvData[itemToEditIndex][validFirstTrackDataIndex + (itemToEditAudioCount.current * numberOfTrackProperties)] = t('newTitle');
          newCsvData[itemToEditIndex][validFirstTrackDataIndex + (itemToEditAudioCount.current * numberOfTrackProperties) + 1] = t('newUrl');
          if (isCC0Music) {
            newCsvData[itemToEditIndex][validFirstTrackDataIndex + (itemToEditAudioCount.current * numberOfTrackProperties) + 2] = t('newUrl');
          }

          itemToEditAudioCount.current += 1;

          if (newCsvData[itemToEditIndex].length > newCsvData[0].length) {
            let lastTrackNumber;
            console.log('serserserser');
            if (!newCsvData[0].includes('track-title-')) {
              lastTrackNumber = 0;
            } else {
              lastTrackNumber = Number(newCsvData[0][newCsvData[0].length - 1].match(/(\d{1,3})$/)[1]);
            }
            const newTrackNumber = lastTrackNumber + 1;
            newCsvData[0].push(`track-title-${newTrackNumber}`);
            if (isCC0Music) {
              newCsvData[0].push(`bsb-url-${newTrackNumber}`);
            }
            newCsvData[0].push(`track-url-${newTrackNumber}`);
          }
          console.log(newCsvData);
          updateContent({ csvData: newCsvData });
        }}
      >
        Audio
      </Button>
      {/* {console.log(csvData[itemToEditIndex])} */}
    </React.Fragment>
  );

  const renderDragger = () => (

    <React.Fragment>
      <FormItem label={t('csvImport')} {...FORM_ITEM_LAYOUT}>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined />
          </p>
          <p className="ant-upload-text">{t('uploadCsvFile')}</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <p className="EmptyState-buttonSubtext List-buttonSubtext">
              {t('dragAndDropOrClick')}
            </p>
          </div>
        </Dragger>
      </FormItem>
      <FormItem label={t('csvExport')} {...FORM_ITEM_LAYOUT}>
        <Button icon={<DownloadOutlined />} onClick={downloadCSV}>Download CSV</Button>
      </FormItem>
    </React.Fragment>
  );

  useEffect(() => {

    if (Object.keys(content).length > 3) {
      const keys = Object.keys(content);
      const newContent = cloneDeep(content);
      const propsToRemove = keys.filter(key => !['csvData', 'listName', 'renderSearch'].includes(key));
      propsToRemove.forEach(prop => {
        delete newContent[prop];
      });
      onContentChanged({ ...newContent });
    }

  }, []);

  console.log(csvData);

  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('listName')} {...FORM_ITEM_LAYOUT}>
          <Input value={listName} onChange={handleListNameChanged} />
        </FormItem>
        {csvData.length < 2 && csvData[0].length === 0 && renderDragger()}
        <FormItem label={t('searchFunctionality')} {...FORM_ITEM_LAYOUT}>
          <Switch
            size="small"
            checked={renderSearch}
            onChange={e => updateContent({ renderSearch: e })}
          />
        </FormItem>

        {hasCsvData
          ? <FormItem label={t('edit')} {...FORM_ITEM_LAYOUT}>
            <RadioGroup value={editorType}>
              <RadioButton value='edit-list' onChange={() => setEditorType('edit-list')}>{t('list')}</RadioButton>
              <RadioButton
                value='edit-items'
                onChange={() => {
                  setIsNewEntryEditActive(false);
                  setEditorType('edit-items');
                }}
              >{t('items')}
              </RadioButton>
            </RadioGroup>
          </FormItem>
          : null}

        {csvData[0][0] && !hasCsvData ? <Divider plain>{t('display')}</Divider> : null}
        <DragAndDropContainer
          droppableId={droppableIdRef.current}
          items={dragAndDropLabels}
          onItemMove={handleMoveLabel}
        />
        {!hasListBeenCreated && !hasCsvData
          ? (
            <FormItem {...FORM_ITEM_LAYOUT}>
              <Button
                icon={<PlusOutlined />}
                type='primary'
                onClick={() => {
                  // setHasListBeenCreated(true);
                  updateContent({ customLabels: [t('newProperty'), t('newProperty')], csvData: [[t('newProperty'), t('newProperty')]], hasCsvData: true });
                }}
              >
                {t('createNewList')}
              </Button>
            </FormItem>
          )
          : null}

        {hasCsvData && editorType === 'edit-list' ? renderCustomListEditor() : null}

        {hasCsvData && editorType === 'edit-items' ? renderItemEditor() : null}
      </Form>
    </div>
  );

}

ListEditor.propTypes = {
  ...sectionEditorProps
};
