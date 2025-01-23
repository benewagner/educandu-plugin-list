import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useRef } from 'react';
import { Input, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import Markdown from '@educandu/educandu/components/markdown.js';
import MarkdownHelp from '@educandu/educandu/components/markdown-help.js';
import ClientConfig from '@educandu/educandu/bootstrap/client-config.js';
import DebouncedInput from '@educandu/educandu/components/debounced-input.js';
import { useService } from '@educandu/educandu/components/container-context.js';
import InputAndPreview from '@educandu/educandu/components/input-and-preview.js';
import PreviewIcon from '@educandu/educandu/components/icons/general/preview-icon.js';
import NeverScrollingTextArea from '@educandu/educandu/components/never-scrolling-text-area.js';
import MarkdownResourceSelector from '@educandu/educandu/components/markdown-resource-selector.js';
import GithubFlavoredMarkdown from '@educandu/educandu/common/github-flavored-markdown.js';

function MarkdownInput({
  minRows,
  disabled,
  inline,
  debounced,
  renderAnchors,
  sanitizeCdnUrls,
  value,
  onBlur,
  onChange,
  preview,
  embeddable,
  maxLength,
  disableResourceSelector,
  ...rest
}) {
  const inputContainerRef = useRef(null);
  const debouncedInputApiRef = useRef(null);
  const { t } = useTranslation('markdownInput');
  const clientConfig = useService(ClientConfig);
  const gfm = useService(GithubFlavoredMarkdown);

  const insertText = ({ text, replaceAll = false, focus = false }) => {
    const input = inputContainerRef.current.querySelector(inline ? 'input[type=text]' : 'textarea');
    if (focus) {
      input.focus();
    }

    const selectionStart = replaceAll ? 0 : input.selectionStart;
    const selectionEnd = replaceAll ? input.value.length : input.selectionEnd;
    const selectionMode = replaceAll ? 'end' : 'select';

    input.setRangeText(text, selectionStart, selectionEnd, selectionMode);
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    debouncedInputApiRef.current?.flush();
  };

  const renderCount = () => !!maxLength && <div className="u-input-count">{value.length} / {maxLength}</div>;

  const handleUrlSelect = url => {
    setTimeout(() => insertText({ text: `![](${url})`, focus: true }), 500);
  };

  const handleBlur = event => {
    const sanitizedValue = gfm.makeCdnResourcesPortable(value, clientConfig.cdnRootUrl);
    if (value !== sanitizedValue) {
      insertText({ text: sanitizedValue, replaceAll: true });
    }
    onBlur(event);
  };

  const renderInlineInput = () => {
    const inputProps = {
      ...rest,
      value,
      disabled,
      maxLength: maxLength || null,
      addonAfter: <MarkdownHelp disabled={disabled} inline />,
      className: classNames('MarkdownInput-input', { 'is-disabled': disabled }),
      onBlur: handleBlur,
      onChange
    };
    return (
      <div className="MarkdownInput-inlineInputContainer" ref={inputContainerRef}>
        {!debounced && <Input {...inputProps} />}
        {!!debounced && <DebouncedInput apiRef={debouncedInputApiRef} {...inputProps} />}
        {renderCount()}
      </div>
    );
  };

  const renderBlockInput = () => (
    <div className="MarkdownInput-textareaContainer List_MarkdownInput-textareaContainer" ref={inputContainerRef}>
      <NeverScrollingTextArea
        {...rest}
        className="MarkdownInput-textarea List_MarkdownInput-textarea"
        value={value}
        debounced={debounced}
        debouncedApiRef={debouncedInputApiRef}
        onChange={onChange}
        onBlur={handleBlur}
        disabled={disabled}
        minRows={minRows}
        embeddable={embeddable}
        maxLength={maxLength || null}
        />
      <div
        className={classNames(
          'MarkdownInput-blockHelpContainer List_MarkdownInput-blockHelpContainer',
          { 'MarkdownInput-blockHelpContainer--embeddable': embeddable }
        )}
        >
        {!disableResourceSelector && (
          <MarkdownResourceSelector small={embeddable} disabled={disabled} onUrlSelect={handleUrlSelect} />
        )}
        <MarkdownHelp small={embeddable} disabled={disabled} />
      </div>
    </div>
  );

  const renderInput = () => inline ? renderInlineInput() : renderBlockInput();

  const renderPreview = () => (
    <div className="MarkdownInput-previewContainer">
      <Markdown
        inline={inline}
        renderAnchors={renderAnchors}
        className={classNames('MarkdownInput-preview', { 'MarkdownInput-preview--inline': inline })}
        >
        {value}
      </Markdown>
      <Tooltip title={t('common:previewArea')}>
        <PreviewIcon className="MarkdownInput-previewWatermark" />
      </Tooltip>
    </div>
  );

  return (
    <div className="MarkdownInput List_MarkdownInput">
      {preview ? <InputAndPreview input={renderInput()} preview={renderPreview()} inline /> : renderInput()}
    </div>
  );
}

MarkdownInput.propTypes = {
  disabled: PropTypes.bool,
  embeddable: PropTypes.bool,
  inline: PropTypes.bool,
  debounced: PropTypes.bool,
  maxLength: PropTypes.number,
  minRows: PropTypes.number,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  preview: PropTypes.bool,
  renderAnchors: PropTypes.bool,
  sanitizeCdnUrls: PropTypes.bool,
  value: PropTypes.string,
  disableResourceSelector: PropTypes.bool
};

MarkdownInput.defaultProps = {
  disabled: false,
  embeddable: false,
  inline: false,
  debounced: false,
  maxLength: 0,
  minRows: 3,
  onBlur: () => {},
  onChange: () => {},
  preview: false,
  renderAnchors: false,
  sanitizeCdnUrls: true,
  value: '',
  disableResourceSelector: false
};

export default MarkdownInput;
