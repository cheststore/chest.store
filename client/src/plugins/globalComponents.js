import {
  // BFormTimepicker,
  BDropdown,
  BDropdownItem,
  BPopover,
  BTooltip,
} from 'bootstrap-vue'

import AddProviderModal from '../components/AddProviderModal'
import Badge from '../components/Badge'
import BaseAlert from '../components/BaseAlert'
import BaseButton from '../components/BaseButton'
import BaseCheckbox from '../components/BaseCheckbox'
import BaseInput from '../components/BaseInput'
import BaseDropdown from '../components/BaseDropdown'
import BaseNav from '../components/BaseNav'
import BasePagination from '../components/BasePagination'
import BaseProgress from '../components/BaseProgress'
import BaseRadio from '../components/BaseRadio'
import BaseSlider from '../components/BaseSlider'
import BaseSwitch from '../components/BaseSwitch'
import BaseTable from '../components/BaseTable'
import BaseHeader from '../components/BaseHeader'
import BucketRepoListNavTabs from '../components/BucketRepoListNavTabs'
import Card from '../components/Card'
import ConfirmationModal from '../components/ConfirmationModal'
import ConfirmationPopover from '../components/ConfirmationPopover'
import FileDetailStats from '../components/FileDetailStats'
import FileListFilters from '../components/FileListFilters'
import FileListTbody from '../components/FileListTbody'
import FileUploader from '../components/FileUploader'
import Loader from '../components/Loader'
import LoaderInline from '../components/LoaderInline'
import PdfViewer from '../components/PdfViewer'
import PreviewObject from '../components/PreviewObject'
import SelectCredential from '../components/SelectCredential'
import SelectDropdownFilter from '../components/SelectDropdownFilter'
import StatsCard from '../components/StatsCard'
import Modal from '../components/Modal'
import TabPane from '../components/Tabs/TabPane'
import Tabs from '../components/Tabs/Tabs'

export default {
  install(Vue) {
    Vue.component('b-dropdown', BDropdown)
    Vue.component('b-dropdown-item', BDropdownItem)
    Vue.component('b-popover', BPopover)
    Vue.component('b-tooltip', BTooltip)
    Vue.component(AddProviderModal.name, AddProviderModal)
    Vue.component(Badge.name, Badge)
    Vue.component(BaseAlert.name, BaseAlert)
    Vue.component(BaseButton.name, BaseButton)
    Vue.component(BaseInput.name, BaseInput)
    Vue.component(BaseNav.name, BaseNav)
    Vue.component(BaseDropdown.name, BaseDropdown)
    Vue.component(BaseCheckbox.name, BaseCheckbox)
    Vue.component(BasePagination.name, BasePagination)
    Vue.component(BaseProgress.name, BaseProgress)
    Vue.component(BaseRadio.name, BaseRadio)
    Vue.component(BaseSlider.name, BaseSlider)
    Vue.component(BaseSwitch.name, BaseSwitch)
    Vue.component(BaseTable.name, BaseTable)
    Vue.component(BaseHeader.name, BaseHeader)
    Vue.component(BucketRepoListNavTabs.name, BucketRepoListNavTabs)
    Vue.component(Card.name, Card)
    Vue.component(ConfirmationModal.name, ConfirmationModal)
    Vue.component(ConfirmationPopover.name, ConfirmationPopover)
    Vue.component(FileDetailStats.name, FileDetailStats)
    Vue.component(FileListFilters.name, FileListFilters)
    Vue.component(FileListTbody.name, FileListTbody)
    Vue.component(FileUploader.name, FileUploader)
    Vue.component(Loader.name, Loader)
    Vue.component(LoaderInline.name, LoaderInline)
    Vue.component(PdfViewer.name, PdfViewer)
    Vue.component(PreviewObject.name, PreviewObject)
    Vue.component(SelectCredential.name, SelectCredential)
    Vue.component(SelectDropdownFilter.name, SelectDropdownFilter)
    Vue.component(StatsCard.name, StatsCard)
    Vue.component(Modal.name, Modal)
    Vue.component(TabPane.name, TabPane)
    Vue.component(Tabs.name, Tabs)
  },
}
