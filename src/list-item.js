import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ClientConfig from '@educandu/educandu/bootstrap/client-config.js';
import { getAccessibleUrl } from '@educandu/educandu/utils/source-utils.js';
import { useService } from '@educandu/educandu/components/container-context.js';

function ListItem({ itemArray, isCC0Music, customLabels, firstTrackDataIndex, archivedByBSB }) {

  const [isClicked, setIsClicked] = useState(false);

  const clientConfig = useService(ClientConfig);

  const renderTracks = () => {
    if (!firstTrackDataIndex) {
      return null;
    }

    const tracksArray = [];
    for (let i = firstTrackDataIndex; i < itemArray.length; i += 3) {

      const accessibleUrl = itemArray[i + 2].startsWith('http') ? itemArray[i + 2] : getAccessibleUrl({ url: itemArray[i + 2], cdnRootUrl: clientConfig.cdnRootUrl });
      console.log(accessibleUrl);

      tracksArray.push((
        <div key={Math.random()} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
          <audio style={{ height: '40px' }} preload="none" controls src={accessibleUrl} />
          <div style={{ fontWeight: 'bold' }}>{itemArray[i]}</div>
          {itemArray[i + 1] !== '' ? <div>{`${archivedByBSB}: `}<a href={itemArray[i + 1]}>Link</a></div> : null}
        </div>));
    }

    return (
      <div className="List-Track">
        {tracksArray}
      </div>
    );
  };

  const renderInfos = () => (
    <div className="List-listItemInfos">
      <ul style={{ listStyle: 'none' }}>
        {customLabels.map((label, i) => i > 0 && itemArray[i] !== '' ? <li key={`${label}-${i}`}><span style={{ fontWeight: 'bold' }}>{`${label}: `}</span>{itemArray[i]}</li> : null)}
      </ul>
      {isCC0Music ? renderTracks() : null}
    </div>
  );

  return (
    <React.Fragment>
      <div className="List-listItem" style={{ backgroundColor: isClicked ? 'hsl(0, 0%, 94%)' : 'white' }} onClick={() => setIsClicked(!isClicked)}>{itemArray[0]}</div>
      {isClicked ? renderInfos() : null}
    </React.Fragment>
  );
}

export default ListItem;

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
