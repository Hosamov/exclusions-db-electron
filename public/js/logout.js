const logoutIcon = document.querySelector('#logout-icon');
const logoutForm = document.querySelector('#logout');

// 
logoutIcon.addEventListener('click', (e) => {
  modal.insertAdjacentHTML(
    'beforeend',
    `<div class="modal-container">
          <div class="modal">
            <button type="button" id="modal-close-btn" class="modal-close-btn"><strong>X</strong></button>
            <h2 class="modal-title">Logout</h2>
            <p id="modal-instructions">Are you sure you wish to logout?</p>
            <button class="btn btn-red" id="action-btn" type="button">Logout</button>
            <button class="btn" type="button" id="modal-back-btn">Cancel</button>
          </div>
        </div>`
  );
  buttonEvents();
});

// Handle logout modal button events:
function buttonEvents() {
  const modalContainer = document.querySelector('.modal-container');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalBackBtn = document.getElementById('modal-back-btn');
  const actionBtn = document.getElementById('action-btn');

  actionBtn.addEventListener('click', () => {
    logoutForm.submit();
  });

  modalCloseBtn.addEventListener('click', () => {
    modalContainer.remove(); //remove it from the screen...
  });

  modalBackBtn.addEventListener('click', () => {
    modalContainer.remove(); //remove it from the screen...
  });
}
