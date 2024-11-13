import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useHistory } from 'react-router-dom'
import { useLoadingSpinner } from 'components/LoadingSpinner'
import { FileUpload } from 'components/FileUpload'
import { uploadFile } from 'services/firebase'
import { StoredFile, StoredFileState } from "data/common";




export const EditEntryType = {
  Text: 'Text',
  TextList: 'TextList',
  DoubleTextList: 'DoubleTextList',
  TextArea: 'TextArea',
  File: 'File',
  Address: 'Address',
  Photo: 'Photo',
  ProfilePhoto: 'ProfilePhoto',
  FilePhoto: 'FilePhoto',
  Radio: 'Radio',
  Checkbox: 'Checkbox',
  Article: 'Article',
  Date: 'Date',
  Select: 'Select',
  Showcase: 'Showcase',
}

export const ValidationType = {
  Email: 'Email',
  PhoneNumber: 'PhoneNumber',
  UserName: 'UserName',
  CheckboxChecked: 'CheckboxChecked',
  RequiredField: 'RequiredField',
  TextLengthBelow30: 'TextLengthBelow30',
  TextLengthBelow50: 'TextLengthBelow50',
  TextLengthBelow100: 'TextLengthBelow100',
  TextLengthBelow200: 'TextLengthBelow200',
  TextLengthBelow300: 'TextLengthBelow300',
  TextLengthBelow400: 'TextLengthBelow400',
  Number: 'Number',
  Price: 'Price',
}

function validateValue(value: unknown, attributeName: String, validationType: ValidationType) {
  switch (validationType) {
    case ValidationType.Email:
      if (value && (value.length > 100 || !/\S+@\S+\.\S+/.test(value))) {
        toast.error(`Error for "${attributeName}"\n\nEmail format is invalid.`);
        return false;
      }
      break;
    case ValidationType.PhoneNumber:
      if (value && (!value.match(/\d/g) || ![10, 11].includes(value.match(/\d/g).length))) {
        toast.error(`Error for "${attributeName}"\n\nPhone number format is invalid.`);
        return;
      }
      break;
    case ValidationType.UserName:
      if (typeof value === 'string' || value instanceof String) {
        toast.error("Invalid User name");
        return false;
      }
      if (!/^[a-z0-9_]+$/.test(value)) {
        toast.error("User name can only contain \"a~z\", number and \"_\".");
        return false;
      }
      break;
    case ValidationType.CheckboxChecked:
      if (!value) {
        toast.error(`Error for "${attributeName}"\n\nPlease check the box.`);
        return false;
      }
      break;

    case ValidationType.RequiredField:
      if (!value) {
        toast.error(attributeName + " is required!");
        return false;
      }
      break;
    case ValidationType.TextLengthBelow30:
      if (!value) return true;
      if (!(typeof value === 'string' || value instanceof String) || value.length > 30) {
        toast.error(`Error for "${attributeName}"\n\nNeeds to be shorter than 30 characters`);
        return false;
      }
      break;
    case ValidationType.TextLengthBelow50:
      if (!value) return true;
      if (!(typeof value === 'string' || value instanceof String) || value.length > 50) {
        toast.error(`Error for "${attributeName}"\n\nNeeds to be shorter than 50 characters`);
        return false;
      }
      break;

    case ValidationType.TextLengthBelow100:
      if (!value) return true;
      if (!(typeof value === 'string' || value instanceof String) || value.length > 100) {
        toast.error(`Error for "${attributeName}"\n\nNeeds to be shorter than 100 characters`);
        return false;
      }
      break;
    case ValidationType.TextLengthBelow200:
      if (!value) return true;
      if (!(typeof value === 'string' || value instanceof String) || value.length > 200) {
        toast.error(`Error for "${attributeName}"\n\nNeeds to be shorter than 200 characters`);
        return false;
      }
      break;
    case ValidationType.TextLengthBelow300:
      if (!value) return true;
      if (!(typeof value === 'string' || value instanceof String) || value.length > 300) {
        toast.error(`Error for "${attributeName}"\n\nNeeds to be shorter than 300 characters`);
        return false;
      }
      break;
    case ValidationType.TextLengthBelow400:
      if (!value) return true;
      if (!(typeof value === 'string' || value instanceof String) || value.length > 400) {
        toast.error(`Error for "${attributeName}"\n\nNeeds to be shorter than 400 characters`);
        return false;
      }
      break;
    case ValidationType.Price:
      if (value && (value.length > 100 || !/^\d*\.?\d*$/.test(value))) {
        toast.error(attributeName + " is invalid. Please enter a valid number with only digits or a decimal.");
        return false;
      }
      if (value && value.split(".")[1] && value.split(".")[1].length > 2) {
        toast.error(attributeName + " is invalid. Please enter a valid number with only digits or a decimal.");
        return false;
      }
      const price = parseFloat(value);
      if (price <= 0 || price > 9999.0) {
        toast.error(`Error for "${attributeName}"\n\nPlease enter a number between 0-9999`);
        return false;
      }

      break;
    case ValidationType.Number:
      if (value && (value.length > 10 || !/^\d*\.?\d*$/.test(value))) {
        toast.error(attributeName + " is invalid. Please enter a valid number");
        return false;
      }
      const number = parseInt(value, 10);
      if (number <= 0 || number > 999.0) {
        toast.error(`Error for "${attributeName}"\n\nPlease enter a number between 0-999`);
        return false;
      }
      break;
    default: break;
  }
  return true;
}

export class EditEntry {
  attribute: String;
  attributeName: String;
  type: EditEntryType;
  isRequired: Boolean;
  validations: [ValidationType];
  extraParam: unknown;
}

export class EditFormProps {
  title: String;
  description: String;
  editEntries: [EditEntry];
  entityObj: unknown;
  onSubmitSuccess: Function;
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function EditForm(props: EditFormProps) {
  const navigate = useNavigate();
  const [loader, showLoader, hideLoader] = useLoadingSpinner();

  const [entity, setEntity] = useState(props.entityObj);
  const [characterCounts, setCharacterCounts] = useState({});

  const [uploadPhotoMap, setUploadPhotoMap] = useState({});

  const uploadFileToFirestore = (fieldName, fileToUpload) => {
    uploadFile(
      props.entityObj ? props.entityObj.id : "",
      fieldName,
      fileToUpload,
      (pc) => null,
      (file: StoredFile) => {
        const uploadPhotoMapCp = { ...uploadPhotoMap };
        uploadPhotoMapCp[fieldName] = file.file_path;
        setUploadPhotoMap(uploadPhotoMapCp);
      }
    )
  };

  useEffect(() => {
    setEntity(props.entityObj);
  }, [props.entityObj]);

  const shadowFileInput = useRef([]);
  useEffect(() => {
    shadowFileInput.current = shadowFileInput.current.slice(0, props.editEntries);
  }, [props.editEntries]);

  const [listFieldSize, setListFieldSize] = useState([]);
  useEffect(() => {
    const currListFieldSize = props.editEntries.map((entry) => {
      const isArrField = props.entityObj && (entry.type === EditEntryType.TextList || entry.type === EditEntryType.DoubleTextList);
      return isArrField ? (
        entry.attribute in props.entityObj && props.entityObj[entry.attribute] ?
          Object.keys(props.entityObj[entry.attribute]).length : 0
      ) : 0;
    })
    setListFieldSize(currListFieldSize);
  }, [props.editEntries]);

  const [radioFieldValue, setRadioFieldValue] = useState([]);
  useEffect(() => {
    const currRadioFieldValue = props.editEntries.map((entry) => {
      const isRadioField = props.entityObj && entry.type === EditEntryType.Radio;
      return isRadioField ? props.entityObj[entry.attribute] : "";
    })
    setRadioFieldValue(currRadioFieldValue);
  }, [props.editEntries]);

  const [checkboxFieldValue, setCheckboxFieldValue] = useState(false);

  return (
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative lg:pt-5 text-left">
      <form className="space-y-8 divide-y divide-gray-200"
        onSubmit={(event) => {
          event.preventDefault();
          // if (!entity || !entity["id"]) {
          //   toast.error("Unknown error.");
          //   return;
          // }
          const updateTargets = new Set(props.editEntries.map((editEntry) => editEntry.attribute));
          const editEntryIdx = Object.fromEntries(props.editEntries.map((editEntry, index) => [editEntry.attribute, index]));

          for (const target of event.target) {
            if (!target.name) continue;
            if (updateTargets.has(target.name)) {
              // if target is radio button, only update if it is checked
              if (target.type === "radio" && !target.checked) continue;
              entity[target.name] = target.value;
            } else if (target.name.includes("_") && updateTargets.has(target.name.split("_")[0])) {
              const entity_field = target.name.split("_")[0];
              const entity_sub_field = target.name.split("_").slice(1).join("_");

              if (entity_sub_field.includes("listfieldidx_")) {
                const entity_curr_idx = entity_sub_field.split("_")[1];
                const entity_sub_sub_field = entity_sub_field.split("_").slice(2);
                const max_idx_to_take = listFieldSize[editEntryIdx[entity_field]];
                if (entity_curr_idx >= max_idx_to_take) continue;
                if (!entity[entity_field]) entity[entity_field] = [];
                if (!entity[entity_field][entity_curr_idx]) entity[entity_field][entity_curr_idx] = {};
                entity[entity_field][entity_curr_idx][entity_sub_sub_field] = target.value;

              } else if (entity_sub_field.includes("listfieldsingleidx_")) {
                const entity_curr_idx = entity_sub_field.split("_")[1];
                const max_idx_to_take = listFieldSize[editEntryIdx[entity_field]];
                if (entity_curr_idx >= max_idx_to_take) continue;
                if (!entity[entity_field]) entity[entity_field] = [];
                if (!entity[entity_field][entity_curr_idx]) entity[entity_field][entity_curr_idx] = {};
                entity[entity_field][entity_curr_idx] = target.value;
                console.log(entity[entity_field], entity['badges'], entity);
              } else {
                if (!entity[entity_field]) entity[entity_field] = {};

                if (typeof target.value === "string" && (
                  target.value.includes("\n") || entity_sub_field === "content" && target.value
                )) {
                  entity[entity_field][entity_sub_field] = target.value.split("\n").filter(e => !!e);
                } else {
                  entity[entity_field][entity_sub_field] = target.value;
                }
              }
            }
          }

          for (const [target_name, target_value] of Object.entries(uploadPhotoMap)) {
            if (updateTargets.has(target_name)) {
              entity[target_name] = target_value;
            } else if (target_name.includes("_") && updateTargets.has(target_name.split("_")[0])) {
              const entity_field = target_name.split("_")[0];
              const entity_sub_field = target_name.split("_").slice(1).join("_");
              if (!entity[entity_field]) entity[entity_field] = {};
              entity[entity_field][entity_sub_field] = target_value;
            }
          }

          for (const editEntry of props.editEntries) {
            if (editEntry.isRequired) {
              if (!entity[editEntry.attribute]) {
                toast.error(`Field is required: "${editEntry.attributeName}"`);
                return;
              }
            }
            if (editEntry.type === EditEntryType.Checkbox) {
              entity[editEntry.attribute] = checkboxFieldValue;
            }

            // For Article fields
            if (editEntry.type === EditEntryType.Article) {
              const article = entity[editEntry.attribute];

              const filledCount = [
                article["title"], article["content"], article["image_url"],
                article["subtitle"], article["button_link"]
              ].filter(e => e).length;

              const mandatoryFilledCount = [
                article["title"], article["content"], article["image_url"]
              ].filter(e => e).length;

              if (filledCount > 0 && mandatoryFilledCount < 3) {
                console.log(filledCount, mandatoryFilledCount, article["title"], article["content"], article["image_url"]);
                toast.error("Title, Content, and Photo are required for " + editEntry.attributeName + ".");
                return;
              }
              if (!article["title"] && !article["content"]) {
                entity[editEntry.attribute] = {};
              }
            }

            // For TextList fields
            const max_idx_to_take = listFieldSize[editEntryIdx[editEntry.attribute]];
            if (max_idx_to_take > 0) {
              entity[editEntry.attribute] = Object.fromEntries(Object.entries(entity[editEntry.attribute]).filter(([k, v]) => parseInt(k, 10) < max_idx_to_take && v["0"] && v["1"]));
            }

            if (editEntry.validations) {
              for (const validation of editEntry.validations) {
                if (!validateValue(entity[editEntry.attribute], editEntry.attributeName, validation)) {
                  return;
                }
              }
            }

            // For Showcase fields
            if (editEntry.type === EditEntryType.Showcase) {
              const showcase = entity[editEntry.attribute];
              const isInstagramShowcase = editEntry.extraParam.isInstagramShowcase;
              const numRequiredFields = isInstagramShowcase ? 5 : 2; // All fields required
              const maxPhotos = editEntry.extraParam.maxPhotos;

              const numPhotos = showcase.image_urls.filter(image_url => image_url.state !== StoredFileState.Deleted).length;
              if (maxPhotos && numPhotos > maxPhotos) {
                toast.error(`Please make sure the ${editEntry.attributeName} section has no more than ${maxPhotos} photos.`);
                return;
              }

              let filledCount = [
                showcase["title"], numPhotos > 0
              ].filter(e => e).length;

              if (isInstagramShowcase) {
                filledCount += [
                  showcase["handle"], showcase["url"], showcase["profile_photo_url"]
                ].filter(e => e).length;
              }

              if (filledCount > 0 && filledCount < numRequiredFields) {
                toast.error(`Title${isInstagramShowcase ? ", Handle, Profile URL, Profile Photo," : ""} and Images are required for ${editEntry.attributeName}.`);
                return;
              }
            }
          }

          if (props.onSubmitSuccess) {
            try {
              props.onSubmitSuccess(entity);
              toast.success("Successfully submitted!");
            } catch (error) {
              console.log(error);
            }
          }
        }}
      >
        {loader}
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-3xl font-medium leading-6 text-gray-900">{props.title}</h3>
              <p className="my-2 text-sm text-gray-500">{props.description}</p>
            </div>
            <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {
                props.editEntries.map((editEntry: EditEntry, index) => {
                  const requiredMark = editEntry.isRequired ? "*" : "";
                  if (editEntry.condition != null) {
                    if (!editEntry.condition) return;
                  }
                  if (!editEntry.type || editEntry.type == EditEntryType.Text) {
                    return (
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          {editEntry.attributeName + requiredMark}
                          {editEntry.subName && (
                            <span className="block text-xs text-gray-500">{editEntry.subName}</span>
                          )}
                        </label>
                        <div className="my-2">
                          <input
                            id={editEntry.attribute}
                            name={editEntry.attribute}
                            type="text"
                            autoComplete={editEntry.attribute}
                            defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute] : ""}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        {editEntry.info && (
                          <p className="text-sm text-gray-500">{editEntry.info}</p>
                        )}
                      </div>
                    )
                  } else if (editEntry.type == EditEntryType.Select) {

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                        {editEntry.attributeName + requiredMark}
                        {editEntry.subName && (
                          <span className="block text-xs text-gray-500">{editEntry.subName}</span>
                        )}
                      </label>
                      <div className="my-2">
                        <select
                          id={editEntry.attribute}
                          name={editEntry.attribute}
                          type="text"
                          autoComplete={editEntry.attribute}
                          defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute] : ""}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <option>United States</option>
                        <option>Canada</option>
                        <option>Mexico</option>
                      </div>
                    </div>
                  } else if (editEntry.type == EditEntryType.Date) {
                    return (
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          {editEntry.attributeName + requiredMark}
                          {editEntry.subName && (
                            <span className="block text-xs text-gray-500">{editEntry.subName}</span>
                          )}
                        </label>
                        <div className="my-2">
                          <input
                            id={editEntry.attribute}
                            name={editEntry.attribute}
                            type="text"
                            autoComplete={editEntry.attribute}
                            defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute] : ""}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    )
                  } else if (editEntry.type == EditEntryType.TextList) {
                    return (
                      <div className="col-span-6">
                        <div className="relative py-5">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                        </div>
                        <div className="col-span-6 pb-2">
                          <h3 className="text-lg font-medium leading-6 text-gray-900">{editEntry.attributeName + requiredMark}</h3>
                        </div>
                        {
                          Array.from(Array(listFieldSize[index]).keys()).map((i) => {
                            return (
                              <div className="my-2">
                                <input
                                  id={editEntry.attribute + "_listfieldsingleidx_" + i}
                                  name={editEntry.attribute + "_listfieldsingleidx_" + i}
                                  type="text"
                                  defaultValue={entity && entity[editEntry.attribute] && entity[editEntry.attribute][i] ? entity[editEntry.attribute][i] : ""}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            );
                          })
                        }
                        <div className="flex">
                          <button
                            type="button"
                            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => {
                              const newListFieldSize = [...listFieldSize];
                              newListFieldSize[index] = Math.min(10, newListFieldSize[index] + 1);
                              setListFieldSize(newListFieldSize);
                            }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            className="ml-3 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => {
                              const newListFieldSize = [...listFieldSize];
                              newListFieldSize[index] = Math.max(1, newListFieldSize[index] - 1);
                              setListFieldSize(newListFieldSize);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  } else if (editEntry.type == EditEntryType.DoubleTextList) {
                    return (
                      <div className="col-span-6">
                        <div className="relative py-5">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                        </div>
                        <div className="col-span-6 pb-2">
                          <h3 className="text-lg font-medium leading-6 text-gray-900">{editEntry.attributeName + requiredMark}</h3>
                          {editEntry.subName && (
                            <p className="text-sm text-gray-500">{editEntry.subName}</p>
                          )}
                        </div>
                        {
                          Array.from(Array(listFieldSize[index]).keys()).map((i) => {
                            return (<>
                              <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                                {"Question " + (i + 1).toString()}
                              </label>
                              <div className="my-2">
                                <input
                                  id={editEntry.attribute + "_listfieldidx_" + i + "_0"}
                                  name={editEntry.attribute + "_listfieldidx_" + i + "_0"}
                                  type="text"
                                  defaultValue={entity && entity[editEntry.attribute] && entity[editEntry.attribute][i] ? entity[editEntry.attribute][i][0] : ""}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                              <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                                {"Answer " + (i + 1).toString()}
                              </label>
                              <div className="my-2">
                                <input
                                  id={editEntry.attribute + "_listfieldidx_" + i + "_1"}
                                  name={editEntry.attribute + "_listfieldidx_" + i + "_1"}
                                  type="text"
                                  defaultValue={entity && entity[editEntry.attribute] && entity[editEntry.attribute][i] ? entity[editEntry.attribute][i][1] : ""}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            </>);
                          })
                        }
                        <div className="flex">
                          <button
                            type="button"
                            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => {
                              const newListFieldSize = [...listFieldSize];
                              newListFieldSize[index] = Math.min(10, newListFieldSize[index] + 1);
                              setListFieldSize(newListFieldSize);
                            }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            className="ml-3 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => {
                              const newListFieldSize = [...listFieldSize];
                              newListFieldSize[index] = Math.max(1, newListFieldSize[index] - 1);
                              setListFieldSize(newListFieldSize);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  } else if (editEntry.type == EditEntryType.Checkbox) {
                    return (
                      <div className="col-span-6 relative flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            id={editEntry.attribute}
                            name={editEntry.attribute}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={(e) => {
                              setCheckboxFieldValue(e.target.checked);
                            }}
                          />
                        </div>
                        <div className="ml-2 text-sm">
                          <label for={editEntry.attribute} className="font-medium text-gray-700">
                            {editEntry.attributeName}
                          </label>
                          <p className="text-gray-500">
                            {editEntry.subName}
                          </p>
                        </div>
                      </div>
                    )
                  } else if (editEntry.type == EditEntryType.Radio) {
                    return (
                      <div className="col-span-6">
                        <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          {editEntry.attributeName + requiredMark}
                          {editEntry.subName && (
                            <span className="block text-xs text-gray-500">{editEntry.subName}</span>
                          )}
                        </label>
                        <fieldset className="mt-4">
                          <div className="space-y-4">
                            {editEntry.options.map((option) => (
                              <div className="flex items-center">
                                <input
                                  name={editEntry.attribute}
                                  type="radio"
                                  checked={String(radioFieldValue[index]) === option}
                                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  value={option}
                                  onChange={(e) => {
                                    const currRadioFieldValue = [...radioFieldValue]
                                    currRadioFieldValue[index] = e.currentTarget.value;
                                    setRadioFieldValue(currRadioFieldValue);
                                  }}
                                />
                                <label className="ml-3 block text-sm font-medium text-gray-700">
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    )

                  } else if (editEntry.type == EditEntryType.TextArea) {
                    return (
                      <div className="col-span-6">
                        <label htmlFor="company_description" className="block text-sm font-medium text-gray-700">
                          {editEntry.attributeName + requiredMark}
                          {editEntry.subName && (
                            <span className="block text-xs text-gray-500">{editEntry.subName}</span>
                          )}

                        </label>
                        <div className="my-2">
                          <textarea
                            id={editEntry.attribute}
                            name={editEntry.attribute}
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute] : ""}
                            onChange={(event) => {
                              const characterCount = event.target.value.length;
                              setCharacterCounts({ ...characterCounts, [editEntry.attribute]: characterCount });
                            }}
                          />
                          {editEntry.characterCount && (
                            <p className={classNames(
                              "mt-3 text-sm",
                              characterCounts[editEntry.attribute] && (characterCounts[editEntry.attribute] > editEntry.characterCount) ?
                                "text-red-500" : "text-gray-500"
                            )}>
                              Character Count: {characterCounts[editEntry.attribute] ? characterCounts[editEntry.attribute] : 0}/{editEntry.characterCount}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  } else if (editEntry.type == EditEntryType.File) {
                    return (
                      <FileUpload
                        fieldDisplayName={editEntry.attributeName}
                        fieldName={editEntry.attribute}
                        initialFiles={entity && entity[editEntry.attribute] ? entity[editEntry.attribute] : []}
                        entityId={entity && entity.id ? entity.id : null}
                        supportedFileTypes={".jpg,.png"}
                        uponFileChange={(files) => entity[editEntry.attribute] = files}
                        isMultiple={true}
                      />
                    );
                  } else if (editEntry.type == EditEntryType.FilePhoto) {
                    return (
                      <FileUpload
                        fieldDisplayName={editEntry.attributeName}
                        fieldDisplaySubName={editEntry.subName}
                        fieldName={editEntry.attribute}
                        initialFiles={entity && entity[editEntry.attribute] ? entity[editEntry.attribute] : []}
                        entityId={entity && entity.id ? entity.id : null}
                        supportedFileTypes={".jpg,.png"}
                        uponFileChange={(files) => entity[editEntry.attribute] = files}
                        isMultiple={true}
                      />
                    );
                  } else if (editEntry.type == EditEntryType.ProfilePhoto) {
                    return (
                      <div className="col-span-6 py-3">
                        <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                          {editEntry.attributeName + requiredMark}
                          {editEntry.subName && (
                            <span className="block text-xs text-gray-500">{editEntry.subName}</span>
                          )}
                        </label>
                        <div className="my-2 flex items-center">
                          <span className="h-12 w-12 overflow-hidden rounded-full bg-gray-300">
                            {
                              uploadPhotoMap[editEntry.attribute] ? (
                                <img className="object-cover aspect-square" src={uploadPhotoMap[editEntry.attribute]} alt="" />
                              ) : (entity && entity[editEntry.attribute]) ?
                                (
                                  <img className="object-cover aspect-square" src={entity[editEntry.attribute]} alt="" />
                                ) : (
                                  <></>
                                )
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => shadowFileInput.current[index].click()}
                            className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            Change
                          </button>
                          <input
                            type="file"
                            accept=".jpg,.png"
                            onChange={(event) => {
                              if (!event.target.files || !event.target.files[0]) return;
                              if (event.target.files[0].size > 10090000) {
                                toast.error("Please upload file under 10MB.");
                                return;
                              }
                              uploadFileToFirestore(editEntry.attribute, event.target.files[0]);
                            }}
                            ref={el => shadowFileInput.current[index] = el}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>
                    );
                  } else if (editEntry.type == EditEntryType.Photo) {
                    return (
                      <div className="col-span-6 py-3">
                        <label htmlFor="cover-photo" className="block text-sm font-medium text-gray-700">
                          {editEntry.attributeName + requiredMark}
                          {editEntry.subName && (
                            <span className="block text-xs text-gray-500">{editEntry.subName}</span>
                          )}
                        </label>
                        {!uploadPhotoMap[editEntry.attribute] && (!entity || !entity[editEntry.attribute]) ? (
                          <>
                            <div className="my-2 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                              <div className="space-y-1 text-center">
                                <svg
                                  className="mx-auto h-12 w-12 text-gray-400"
                                  stroke="currentColor"
                                  fill="none"
                                  viewBox="0 0 48 48"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                  <label
                                    htmlFor={editEntry.attribute}
                                    className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                                  >
                                    <span>Select a file</span>
                                    <input id={editEntry.attribute}
                                      name={editEntry.attribute}
                                      type="file"
                                      className="sr-only"
                                      accept={'.jpg,.png'}
                                      onClick={(event) => {
                                        console.log();
                                        event.target.value = null
                                      }}
                                      onChange={(event) => {
                                        if (!event.target.files || !event.target.files[0]) return;
                                        if (event.target.files[0].size > 10090000) {
                                          toast.error("Please upload file under 10MB.");
                                          return;
                                        }
                                        uploadFileToFirestore(editEntry.attribute, event.target.files[0]);
                                      }}
                                      ref={el => shadowFileInput.current[index] = el}
                                    />
                                  </label>
                                  <p className="pl-1"> to upload</p>
                                </div>
                                <p className="text-xs text-gray-500">{'.jpg, .png' + " up to 10MB"}</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="my-2 flex rounded-md overflow-hidden max-w-xl">

                              <span className="overflow-hidden bg-gray-300">
                                {uploadPhotoMap[editEntry.attribute] ? (
                                  <img className="object-cover aspect-video" src={uploadPhotoMap[editEntry.attribute]} alt="" />
                                ) : (
                                  <img className="object-cover aspect-video" src={entity[editEntry.attribute]} alt="" />
                                )}
                              </span>

                            </div>
                            <div className="py-2">
                              <button
                                type="button"
                                onClick={() => shadowFileInput.current[index].click()}
                                className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              >
                                Change
                              </button>
                              <input
                                type="file"
                                accept=".jpg,.png"
                                onChange={(event) => {
                                  if (!event.target.files || !event.target.files[0]) return;
                                  if (event.target.files[0].size > 10090000) {
                                    toast.error("Please upload file under 10MB.");
                                    return;
                                  }
                                  uploadFileToFirestore(editEntry.attribute, event.target.files[0]);
                                }}
                                ref={el => shadowFileInput.current[index] = el}
                                style={{ display: 'none' }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  } else if (editEntry.type == EditEntryType.Article) {
                    return (
                      <div className="col-span-6">
                        <div className="relative py-5">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                        </div>
                        <div className="col-span-6 pb-2">
                          <h3 className="text-lg font-medium leading-6 text-gray-900">{editEntry.attributeName}</h3>
                          {editEntry.subName && (
                            <p className="text-xs text-gray-500">{editEntry.subName}</p>
                          )}
                        </div>
                        {/* <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          Tagline
                        </label>
                        <div className="my-2">
                          <input
                            id={editEntry.attribute + "_tagline"}
                            name={editEntry.attribute + "_tagline"}
                            type="text"
                            defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["tagline"] : ""}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div> */}
                        <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <div className="my-2">
                          <input
                            id={editEntry.attribute + "_title"}
                            name={editEntry.attribute + "_title"}
                            type="text"
                            defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["title"] : ""}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          Subtitle
                        </label>
                        <div className="my-2">
                          <input
                            id={editEntry.attribute + "_subtitle"}
                            name={editEntry.attribute + "_subtitle"}
                            type="text"
                            defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["subtitle"] : ""}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          Content
                        </label>
                        <div className="my-2">
                          <textarea
                            id={editEntry.attribute + "_content"}
                            name={editEntry.attribute + "_content"}
                            rows={10}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            defaultValue={entity && entity[editEntry.attribute] && entity[editEntry.attribute]["content"] ? (typeof entity[editEntry.attribute]["content"] === "string" ? entity[editEntry.attribute]["content"] : entity[editEntry.attribute]["content"].join("\n")) : ""}
                          />
                        </div>
                        {
                          editEntry.button && (
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                              <div className="col-span-6 sm:col-span-3">
                                <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                                  Button Text
                                </label>
                                <div className="my-2">
                                  <input
                                    id={editEntry.attribute + "_button_text"}
                                    name={editEntry.attribute + "_button_text"}
                                    type="text"
                                    placeholder="Etsy Shop"
                                    defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["button_text"] : editEntry.button}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>

                              <div className="col-span-6 sm:col-span-3">
                                <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                                  Button URL
                                </label>
                                <div className="my-2">
                                  <input
                                    id={editEntry.attribute + "_button_link"}
                                    name={editEntry.attribute + "_button_link"}
                                    type="text"
                                    placeholder="https://www.example.com"
                                    defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["button_link"] : ""}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          )

                        }
                        <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                          Attached Photo
                        </label>
                        <div className="my-2 flex items-center">

                          <span className="h-20 aspect-video overflow-hidden bg-gray-300">
                            {
                              uploadPhotoMap[editEntry.attribute + "_image_url"] ? (
                                <img src={uploadPhotoMap[editEntry.attribute + "_image_url"]} alt=""
                                  className="aspect-video object-contain"
                                />
                              ) : (entity && entity[editEntry.attribute] && entity[editEntry.attribute]["image_url"]) ?
                                (
                                  <img src={entity[editEntry.attribute]["image_url"]} alt=""
                                    className="aspect-video object-contain"
                                  />
                                ) : (
                                  <></>
                                )
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => shadowFileInput.current[index].click()}
                            className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            Change
                          </button>
                          <input
                            type="file"
                            accept=".jpg,.png"
                            onChange={(event) => {
                              if (!event.target.files || !event.target.files[0]) return;
                              if (event.target.files[0].size > 10090000) {
                                toast.error("Please upload file under 10MB.");
                                return;
                              }
                              uploadFileToFirestore(editEntry.attribute + "_image_url", event.target.files[0]);
                            }}
                            ref={el => shadowFileInput.current[index] = el}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>
                    );
                  } else if (editEntry.type == EditEntryType.Address) {
                    return (
                      <div className="col-span-6">
                        <div className="relative my-5">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                        </div>
                        <div className="col-span-6 py-2">
                          <h3 className="text-lg font-medium leading-6 text-gray-900">{editEntry.attributeName}</h3>
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="col-span-6">
                            <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                              Street Address
                            </label>
                            <div className="my-2">
                              <input
                                type="text"
                                name={editEntry.attribute + "_street_address"}
                                id={editEntry.attribute + "_street_address"}
                                defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["street_address"] : ""}
                                autoComplete="street-address"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                              City/Town
                            </label>
                            <div className="my-2">
                              <input
                                type="text"
                                name={editEntry.attribute + "_city"}
                                id={editEntry.attribute + "_city"}
                                defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["city"] : ""}
                                autoComplete="city"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                              State
                            </label>
                            <div className="my-2">
                              <input
                                type="text"
                                name={editEntry.attribute + "_province"}
                                id={editEntry.attribute + "_province"}
                                defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["province"] : ""}
                                autoComplete="province"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                              Country*
                            </label>
                            <div className="my-2">
                              <select
                                id={editEntry.attribute + "_country"}
                                name={editEntry.attribute + "_country"}
                                autoComplete="country-name"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              >
                                <option selected={entity && entity[editEntry.attribute] && entity[editEntry.attribute]["country"] === "United States"}>United States</option>
                                <option selected={entity && entity[editEntry.attribute] && entity[editEntry.attribute]["country"] === "Canada"}>Canada</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                              Postal Code
                            </label>
                            <div className="my-2">
                              <input
                                type="text"
                                name={editEntry.attribute + "_postal_code"}
                                id={editEntry.attribute + "_postal_code"}
                                defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["postal_code"] : ""}
                                autoComplete="postal-code"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (editEntry.type === EditEntryType.Showcase) {
                    const isInstagramShowcase = editEntry.extraParam.isInstagramShowcase;

                    // Add attribute to entity if it doesn't exist
                    if (entity) {
                      entity[editEntry.attribute] = entity[editEntry.attribute] || {};
                      entity[editEntry.attribute]["image_urls"] = entity[editEntry.attribute]["image_urls"] || [];
                    }

                    return (
                      <div className="col-span-6" key={editEntry.attribute}>
                        <div className="relative py-5">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                        </div>
                        <div className="col-span-6 pb-2">
                          <h3 className="text-lg font-medium leading-6 text-gray-900">{editEntry.attributeName}</h3>
                          {editEntry.subName && (
                            <p className="text-xs text-gray-500">{editEntry.subName}</p>
                          )}
                        </div>

                        <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                          Title
                          {editEntry.subTitle && (
                            <span className="block text-xs text-gray-500">{editEntry.subTitle}</span>
                          )}

                        </label>
                        <div className="my-2">
                          <input
                            id={editEntry.attribute + "_title"}
                            name={editEntry.attribute + "_title"}
                            type="text"
                            defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["title"] : ""}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        {isInstagramShowcase && (
                          <>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                              <div className="col-span-6 sm:col-span-3">
                                <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                                  Handle
                                </label>
                                <div className="my-2">
                                  <input
                                    id={editEntry.attribute + "_handle"}
                                    name={editEntry.attribute + "_handle"}
                                    type="text"
                                    placeholder="@"
                                    defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["handle"] : ""}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>

                              <div className="col-span-6 sm:col-span-3">
                                <label htmlFor={editEntry.attribute} className="block text-sm font-medium text-gray-700">
                                  Profile URL
                                </label>
                                <div className="my-2">
                                  <input
                                    id={editEntry.attribute + "_url"}
                                    name={editEntry.attribute + "_url"}
                                    type="text"
                                    placeholder="https://www.instagram.com/username/"
                                    defaultValue={entity && entity[editEntry.attribute] ? entity[editEntry.attribute]["url"] : ""}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="col-span-6 py-3">
                              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                                Instagram Profile Photo
                              </label>
                              <div className="my-2 flex items-center">
                                <span className="h-12 w-12 overflow-hidden rounded-full bg-gray-300">
                                  {
                                    uploadPhotoMap[editEntry.attribute + "_profile_photo_url"] ? (
                                      <img className="object-cover aspect-square" src={uploadPhotoMap[editEntry.attribute + "_profile_photo_url"]} alt="" />
                                    ) : (entity && entity[editEntry.attribute] && entity[editEntry.attribute]["profile_photo_url"]) ?
                                      (
                                        <img className="object-cover aspect-square" src={entity[editEntry.attribute]["profile_photo_url"]} alt="" />
                                      ) : (
                                        <></>
                                      )
                                  }
                                </span>
                                <button
                                  type="button"
                                  onClick={() => shadowFileInput.current[index].click()}
                                  className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                  Change
                                </button>
                                <input
                                  type="file"
                                  accept=".jpg,.png"
                                  onChange={(event) => {
                                    if (!event.target.files || !event.target.files[0]) return;
                                    if (event.target.files[0].size > 10090000) {
                                      toast.error("Please upload file under 10MB.");
                                      return;
                                    }
                                    uploadFileToFirestore(editEntry.attribute + "_profile_photo_url", event.target.files[0]);
                                  }}
                                  ref={el => shadowFileInput.current[index] = el}
                                  style={{ display: 'none' }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <FileUpload
                          fieldDisplayName="Images"
                          fieldDisplaySubName={`Select up to 6 images to showcase${isInstagramShowcase ? " your Instagram" : ""}.`}
                          fieldName={editEntry.attribute + "_image_urls"}
                          initialFiles={entity && entity[editEntry.attribute] && entity[editEntry.attribute]["image_urls"] ? entity[editEntry.attribute]["image_urls"] : []}
                          entityId={entity && entity.id ? entity.id : null}
                          supportedFileTypes={".jpg,.png"}
                          uponFileChange={(files) => {
                            if (entity && entity[editEntry.attribute]) {
                              entity[editEntry.attribute]["image_urls"] = files;
                            }
                          }}
                          isMultiple={true}
                        />

                      </div>
                    );
                  }
                })
              }
            </div >
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => {
                navigate(-1);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {props.buttonText ? props.buttonText : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}