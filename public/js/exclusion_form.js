const exclusionLength = document.getElementById('exclusion_length');
const otherLength = document.getElementById('other-length');
const otherLabel = document.getElementById('other-label');

function exclusionLengthChange() {
  console.log(exclusionLength.value);
  if(exclusionLength.value === 'other') {
    otherLength.type = 'number';
    otherLabel.hidden = false;
  } else {
    otherLength.type = 'hidden';
    otherLabel.hidden = true;
  }
}
