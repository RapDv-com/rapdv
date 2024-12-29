// Copyright (C) Konrad Gadzinowski

export class Form {
  public static setupForms = () => {
    // Validate forms
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms: any = document.querySelectorAll(".needs-validation")

    // Loop over them and prevent submission
    for (const form of forms) {

      // In Firefox, check validity on submit button click. You can't prevent form submit event on Firefox.
      const submitButtons = form.querySelectorAll("button[type=submit]") ?? []
      for (const button of submitButtons) {
        // Handle submit event
        button.addEventListener(
          "click",
          (event) => {
            form.classList.add("was-validated")

            // Validate form
            if (!form.checkValidity()) {
              event.preventDefault()
              event.stopPropagation()
              return false
            }

            return true
          },
          true
        )
      }
      
      // Handle submit event
      form.addEventListener(
        "submit",
        (event) => {
          form.classList.add("was-validated")

          // Validate form
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
            return false
          }
  
          // If valid block all submit buttons, so that they can't be clicked again
          const submitButtons = form.querySelectorAll("button[type=submit]")
          for (const button of submitButtons) {
            button.type = "button"
            button.disabled = "true"
          }
        },
        true
      )
    }
  }
}
