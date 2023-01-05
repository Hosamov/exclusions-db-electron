const modal = document.getElementById('modal');

function displayModalwindow(title, instructions, btnSrc, actionBtn) {
  modal.insertAdjacentHTML(
    'beforeend',
    `<div class="modal-container">
        <div class="modal">
          <button type="button" id="modal-close-btn" class="modal-close-btn"><strong>X</strong></button>
          <h2 class="modal-title">${title}</h2>
          <p id="modal-instructions">${instructions}</p>
          <button class="btn btn-red action-btn" type="button" onclick="window.location.href='${btnSrc}'">${actionBtn}</button>
          <button class="btn" type="button" id="modal-back-btn">Back</button>
        </div>
      </div>`
  );
  
  const modalContainer = document.querySelector('.modal-container');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalBackBtn = document.getElementById('modal-back-btn');
  
  modalCloseBtn.addEventListener('click', () => {
    modalContainer.remove(); //remove it from the screen...
  });

  modalBackBtn.addEventListener('click', () => {
    modalContainer.remove(); //remove it from the screen...
  });
}

// displayModalwindow();
