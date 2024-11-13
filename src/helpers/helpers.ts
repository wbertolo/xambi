import { EditEntryType, ValidationType } from '@/defs/defs'
import { useNavigate } from 'react-router-dom'
import useLoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

export function validateValue(value: unknown, attributeName: String, validationType: ValidationType) {
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
}