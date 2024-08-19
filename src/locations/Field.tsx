import React, { useEffect, useRef, useState } from 'react';
import { Note, TextInput } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import slugify from "@sindresorhus/slugify";

/* Field used on navigation items slug field
   Simpler version of https://github.com/pauloamgomes/contentful-better-slugs-app/tree/main
   - It is not unique
   - It is required
   - Makes slug from title if not published
 */
const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const debounceInterval: any = useRef(false);
  const detachExternalChangeHandler: any = useRef(null);
  const [value, setValue] = useState<string | undefined>(
    sdk.field.getValue() || ""
  );

  useEffect(() => {
    sdk.window.startAutoResizer();
    const listener = sdk.entry.fields.title.onValueChanged(
      'en-US',
      () => {
        if (debounceInterval.current) {
          clearInterval(debounceInterval.current);
        }
        debounceInterval.current = setTimeout(() => {
          if (isLocked()) return;
          updateSlug(sdk.entry.fields.title.getValue());
        }, 500);
      }
    );
    return () => {
      // Remove debounce interval
      if (debounceInterval.current) {
        clearInterval(debounceInterval.current);
      }

      // Remove external change listener
      if (detachExternalChangeHandler.current) {
        detachExternalChangeHandler.current();
      }

      listener?.();
    };

  }, []);

  const isLocked = () => {
    const sys: any = sdk.entry.getSys();

    const published =
      !!sys.publishedVersion && sys.version === sys.publishedVersion + 1;
    const changed =
      !!sys.publishedVersion && sys.version >= sys.publishedVersion + 2;

    return published || changed;
  };

  const updateSlug = async (text: string) => {
    if (!text) {
      setValue("");
      return;
    }
    // if (isLocked()) return;
    const value = text
      .split("-")
      .map((part: string) => slugify(part))
      .join("-");

    setValue(value);

    if (value) {
      await sdk.field.setValue(value);
    } else {
      await sdk.field.removeValue();
    }
  }

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSlug(e.currentTarget.value)
  };

  return (
    <>
      <TextInput
        value={value}
        aria-label="Slug"
        id={sdk.field.id}
        onChange={onInputChange}
        isRequired
      />
      <Note>This field is not unique. It determines the slug of the attached page or segment for child items. When this is saved, it auto updates the slug reference all attached pages and descendants that have pages. </Note>
    </>
  )
};

export default Field;
