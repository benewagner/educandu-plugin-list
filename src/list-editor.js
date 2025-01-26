import Papa from 'papaparse';
import jschardet from 'jschardet';
import CSVLabel from './csv-label.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './list-markdown-input.js';
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

const { Dragger } = Upload;
const logger = new Logger(import.meta.url);
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function ListEditor({ content, onContentChanged }) {

  const droppableIdRef = useRef(useId());
  const { t } = useTranslation('benewagner/educandu-plugin-list');
  // const [isNewEntryEditActive, setIsNewEntryEditActive] = useState(false);
  const { listName, csvData, renderSearch } = content;
  const isCC0Music = csvData[0].includes('bsb-url-1');

  const hasCsvData = csvData.length >= 1 && csvData[0].length > 0;

  const firstTrackDataIndex = csvData[0].findIndex(elem => elem.includes('track-title-'));
  console.log(firstTrackDataIndex);

  const customLabels = csvData?.[0];

  // const audioCount = customLabels.filter(label => label.includes('track-title-')).length;
  const itemToEditAudioCount = useRef(0);

  // const [triggerRender, setTriggerRender] = useState(false);

  const [itemToEditIndex, setItemToEditIndex] = useState(1);

  const hasListBeenCreated = customLabels.length > 0;

  const FormItem = Form.Item;
  const encodingRef = useRef(null);

  // const newItemData = useRef(customLabels.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map(() => ''));

  const getAudioTemplate = () => isCC0Music ? ['', '', '',] : ['', ''];
  // const audioTemplate = getAudioTemplate();

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

  const handleCustomLabelChanged = (event, index) => {
    const { value } = event.target;
    const newCsvData = cloneDeep(csvData);
    newCsvData[0][index] = value;
    updateContent({ csvData: newCsvData });
  };

  const handleMoveLabelUp = index => {
    const newCsvData = csvData.map(row => swapItemsAt(row, index, index - 1));
    updateContent({ csvData: newCsvData });
  };

  const handleMoveLabelDown = index => {
    const newCsvData = csvData.map(row => swapItemsAt(row, index, index + 1));
    updateContent({ csvData: newCsvData });
  };

  const handleDeleteLabel = index => {
    const newCsvData = csvData.map(row => removeItemAt(row, index));
    updateContent({ csvData: newCsvData });
  };

  const handleMoveLabel = (fromIndex, toIndex) => {
    const displayData = csvData.map(row => moveItem(row, fromIndex, toIndex));
    const lastRow = displayData[displayData.length - 1];
    lastRow.length === 1 && lastRow[0] === '' ? displayData.splice(-1, 1) : null;
    const csvDataLabels = displayData.shift();
    displayData.sort((a, b) => a[0].localeCompare(b[0]));
    displayData.splice(0, 0, csvDataLabels);
    updateContent({ csvData: displayData });
  };

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

  const renderCustomListCsvData = ({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength }) => {

    return (
      <React.Fragment>
        <CSVLabel
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
        </CSVLabel>
        {index === 0 ? <Divider plain>{t('foldOutContent')}</Divider> : null}
      </React.Fragment>
    );
  };

  const getDragAndDropCustomListItems = () => customLabels?.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map((label, index) => ({
    key: `new-label-${index}`,
    render: ({ dragHandleProps, isDragged, isOtherDragged }) => renderCustomListCsvData({ label, index, dragHandleProps, isDragged, isOtherDragged, arrayLength: customLabels.length })
  }));

  let dragAndDropCustomListLabels = [];

  if (hasCsvData) {
    dragAndDropCustomListLabels = getDragAndDropCustomListItems();
  }

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

            const newCsvData = csvData.map((arr, index) => {
              const newValue = index === 0 ? t('newProperty') : '';
              if (firstTrackDataIndex !== -1) {
                arr.splice(firstTrackDataIndex, 0, newValue);
              } else {
                arr.push(newValue);
              }
              return arr;
            });

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

      {renderCustomListLabels()}

      {/* <Divider plain>{t('newItem')}</Divider> */}

      {/* {!isNewEntryEditActive
        ? <FormItem {...FORM_ITEM_LAYOUT}>
          <Button icon={<PlusOutlined />} type='primary' onClick={() => setIsNewEntryEditActive(true)} />
        </FormItem>
        : null}

      {isNewEntryEditActive
        ? customLabels.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map((label, index) => (
          <FormItem key={`${customListLabelKeys.current[index]}-newItem`} {...FORM_ITEM_LAYOUT} label={label}>
            <MarkdownInput minRows={1} onChange={e => { newItemData.current[index] = e.target.value; }} />
          </FormItem>
        ))
        : null} */}

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
      {/* {hasListBeenCreated && isNewEntryEditActive
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
                setIsNewEntryEditActive(false);

                for (const audio of newAudios.current) {

                  let hasInfo = false;
                  for (const dataString of audio) {
                    if (dataString !== '') {
                      hasInfo = true;
                    }
                  }

                  if (hasInfo) {
                    for (const dataString of audio) {
                      newItemData.current.push(dataString);
                    }
                  }
                }

                if (newItemData.current.every(string => string === '')) {
                  newAudios.current = [];
                  setAudioUrls([]);
                  setTriggerRender(prev => !prev);
                  return;
                }

                const newCsvData = cloneDeep(csvData);
                newCsvData.push(newItemData.current);

                const csvDataLabels = newCsvData.shift();
                newCsvData.sort((a, b) => a[0].localeCompare(b[0]));
                newCsvData.splice(0, 0, csvDataLabels);

                if (newAudios.current.length > audioCount) {

                  const surplusAudiosCount = newAudios.current.length - audioCount;

                  for (let i = audioCount; i < audioCount + surplusAudiosCount; i += 1) {
                    newCsvData[0].push(`track-title-${i}`);
                    if (isCC0Music) {
                      newCsvData[0].push(`bsb-url-${i}`);
                    }
                    newCsvData[0].push(`track-url-${i}`);
                  }
                }

                newAudios.current = [];
                setAudioUrls([]);

                updateContent({ csvData: newCsvData });
                newItemData.current = customLabels.filter(label => !label.includes('track-title-') && !label.includes('track-url-') && !label.includes('bsb-url-')).map(() => '');
              }}
            >
              {t('save')}
            </Button>
          </div>
        </React.Fragment>
        : null} */}
    </React.Fragment>
  );

  const handleItemWasEdited = (e, propertyIndex, isUrl = false) => {
    const newCsvData = cloneDeep(csvData);
    const newValue = isUrl ? e : e.target.value;
    newCsvData[itemToEditIndex][propertyIndex] = newValue;

    if (newCsvData[itemToEditIndex].every(str => str === '')) {
      newCsvData.splice(itemToEditIndex, 1);
      setItemToEditIndex(1);
      updateContent({ csvData: newCsvData });
      return;
    }

    let i = firstTrackDataIndex;

    while (i < newCsvData[itemToEditIndex].length) {
      if (newCsvData[itemToEditIndex] === '' && newCsvData[itemToEditIndex + 1] === '') {
        if (isCC0Music) {
          if (newCsvData[itemToEditIndex + 2] === '') {
            newCsvData[itemToEditIndex].splice(i, 3);
          }
        } else {
          newCsvData[itemToEditIndex].splice(i, 2);
        }
      } else {
        i += 1;
      }
    }

    updateContent({ csvData: newCsvData });
  };

  const handleAddItem = () => {
    const newContent = cloneDeep(content);
    const newItem = customLabels.map((label, index) => index === 0 ? 'Neuer Datensatz' : '');
    newContent.csvData.push(newItem);
    updateContent(newContent);
    setItemToEditIndex(newContent.csvData.length - 1);
  };

  const renderItemEditor = () => (
    <React.Fragment>
      {csvData.length > 1
        ? <FormItem label={t('item')} {...FORM_ITEM_LAYOUT}>
          <InputNumber min={1} max={csvData.length - 1} value={itemToEditIndex} onChange={e => setItemToEditIndex(e)} />
        </FormItem>
        : null}
      <Divider plain>{csvData.length > 1 ? t('editItem') : t('noItemsYet')}</Divider>

      <FormItem {...FORM_ITEM_LAYOUT}>
        <Button icon={<PlusOutlined />} type='primary' onClick={handleAddItem} />
      </FormItem>

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
            <FormItem label={newLabel} {...FORM_ITEM_LAYOUT}>
              {/* <Input value={csvData[itemToEditIndex][index]} onChange={e => handleItemWasEdited(e, index)} /> */}
              <MarkdownInput minRows={1} value={csvData[itemToEditIndex][index]} onChange={e => handleItemWasEdited(e, index)} />
            </FormItem>
          </React.Fragment>
        );
      })}
      {csvData.length > 1 && <Button
        icon={<PlusOutlined />}
        type="primary"
        style={{ marginLeft: '32px', marginTop: '16px' }}
        onClick={() => {
          const newCsvData = cloneDeep(csvData);
          let validFirstTrackDataIndex = firstTrackDataIndex;
          if (validFirstTrackDataIndex === -1) {
            validFirstTrackDataIndex = newCsvData[0].length;
          }
          const numberOfTrackProperties = isCC0Music ? 3 : 2;
          newCsvData[itemToEditIndex][validFirstTrackDataIndex + (itemToEditAudioCount.current * numberOfTrackProperties)] = t('newTitle');
          newCsvData[itemToEditIndex][validFirstTrackDataIndex + (itemToEditAudioCount.current * numberOfTrackProperties) + 1] = t('newUrl');
          if (isCC0Music) {
            newCsvData[itemToEditIndex][validFirstTrackDataIndex + (itemToEditAudioCount.current * numberOfTrackProperties) + 2] = t('newUrl');
          }

          itemToEditAudioCount.current += 1;

          if (newCsvData[itemToEditIndex].length > newCsvData[0].length) {
            let lastTrackNumber;
            if (!newCsvData[0].includes('track-title-0')) {
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
          updateContent({ csvData: newCsvData });
        }}
      >
        Audio
      </Button>}
    </React.Fragment>
  );

  const renderDragger = () => (

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
  );

  useEffect(() => {

    const newContent = cloneDeep(content);
    const newCsvData = cloneDeep(csvData);

    if (Object.keys(content).length > 3) {
      const keys = Object.keys(content);

      const propsToRemove = keys.filter(key => !['csvData', 'listName', 'renderSearch'].includes(key));
      propsToRemove.forEach(prop => {
        delete newContent[prop];
      });
    }

    if (csvData.length > 1) {
      // const newCsvData = cloneDeep(csvData);
      let i = 1;

      while (i < newCsvData.length) {
        if (newCsvData[i].every(elem => elem === '')) {
          newCsvData.splice(i, 1);
          newContent.csvData = newCsvData;
        } else {
          i += 1;
        }
      }
    }

    const csvDataLabels = newCsvData.shift();
    newCsvData.sort((a, b) => a[0].localeCompare(b[0]));
    newCsvData.splice(0, 0, csvDataLabels);

    newContent.csvData = newCsvData;

    onContentChanged({ ...newContent });

  }, []);

  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('listName')} {...FORM_ITEM_LAYOUT}>
          <Input value={listName} onChange={handleListNameChanged} />
        </FormItem>
        {csvData.length < 2 && csvData[0].length === 0 && renderDragger()}
        <FormItem label={t('csvExport')} {...FORM_ITEM_LAYOUT}>
          <Button icon={<DownloadOutlined />} onClick={downloadCSV}>Download CSV</Button>
        </FormItem>
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
                  // setIsNewEntryEditActive(false);
                  setEditorType('edit-items');
                }}
              >{t('items')}
              </RadioButton>
            </RadioGroup>
          </FormItem>
          : null}

        {!hasListBeenCreated && !hasCsvData
          ? (
            <FormItem {...FORM_ITEM_LAYOUT}>
              <Button
                icon={<PlusOutlined />}
                type='primary'
                onClick={() => {
                  updateContent({ csvData: [[t('newProperty'), t('newProperty')]] });
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
