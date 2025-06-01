document.addEventListener("DOMContentLoaded", () => {
    // Get all required DOM elements with null checks
    const themeToggle = document.getElementById("theme-toggle") || null
    const passwordDisplay = document.getElementById("password-display") || null
    const lengthSlider = document.getElementById("length") || null
    const lengthValue = document.getElementById("length-value") || null
    const uppercaseCheckbox = document.getElementById("uppercase") || null
    const lowercaseCheckbox = document.getElementById("lowercase") || null
    const numbersCheckbox = document.getElementById("numbers") || null
    const symbolsCheckbox = document.getElementById("symbols") || null
    const generateButton = document.getElementById("generate-button") || null
    const copyButton = document.getElementById("copy-button") || null
    const strengthFill = document.getElementById("strength-fill") || null
    const strengthText = document.getElementById("strength-text") || null
  
    // Add click event to the entire option div, not just the checkbox
    document.querySelectorAll(".option").forEach((option) => {
      option.addEventListener("click", (e) => {
        const checkbox = option.querySelector('input[type="checkbox"]')
        if (!checkbox) return
  
        // Toggle checkbox unless the click was on the checkbox itself
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked
          // Trigger change event to update password
          checkbox.dispatchEvent(new Event("change"))
        }
      })
    })
  
    const CHARSETS = {
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    }
  
    // --- Theme Handling ---
    const applyTheme = (theme) => {
      if (theme === "dark") {
        document.body.classList.add("dark-mode")
        if (themeToggle) {
          themeToggle.textContent = "🌙"
        }
      } else {
        document.body.classList.remove("dark-mode")
        if (themeToggle) {
          themeToggle.textContent = "☀️"
        }
      }
    }
  
    // Load saved theme or default to system preference
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get("theme", (data) => {
          if (data.theme) {
            applyTheme(data.theme)
          } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
              applyTheme("dark")
            } else {
              applyTheme("light")
            }
          }
        })
      } else {
        // Use system preference if chrome.storage is not available
        const mockTheme =
          window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        applyTheme(mockTheme)
      }
    } catch (e) {
      // Silently handle any errors with theme detection
      applyTheme("light") // Default to light theme
    }
  
    // Theme toggle listener
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.contains("dark-mode")
        const newTheme = isDarkMode ? "light" : "dark"
        applyTheme(newTheme)
        try {
          if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set({ theme: newTheme }) // Save theme preference
          }
        } catch (e) {
          // Silently handle any errors with storage
        }
      })
    }
  
    // --- Password Strength Evaluation ---
    const evaluatePasswordStrength = (password) => {
      if (!password) return { score: 0, label: "Password strength" }
  
      let score = 0
  
      // Length check
      if (password.length >= 8) score += 1
      if (password.length >= 12) score += 1
      if (password.length >= 16) score += 1
  
      // Character variety check
      if (/[A-Z]/.test(password)) score += 1
      if (/[a-z]/.test(password)) score += 1
      if (/[0-9]/.test(password)) score += 1
      if (/[^A-Za-z0-9]/.test(password)) score += 1
  
      // Normalize score to 0-4 range
      score = Math.min(Math.floor(score / 2), 4)
  
      const labels = ["Password strength", "Weak", "Medium", "Strong", "Very Strong"]
      const classes = ["", "weak", "medium", "strong", "very-strong"]
  
      return {
        score,
        label: labels[score],
        class: classes[score],
      }
    }
  
    // --- Password Generation ---
    const generatePassword = () => {
      if (!lengthSlider || !passwordDisplay) return
  
      const length = Number.parseInt(lengthSlider.value, 10)
      let characterPool = ""
      let generatedPassword = ""
  
      if (uppercaseCheckbox && uppercaseCheckbox.checked) characterPool += CHARSETS.uppercase
      if (lowercaseCheckbox && lowercaseCheckbox.checked) characterPool += CHARSETS.lowercase
      if (numbersCheckbox && numbersCheckbox.checked) characterPool += CHARSETS.numbers
      if (symbolsCheckbox && symbolsCheckbox.checked) characterPool += CHARSETS.symbols
  
      // Ensure at least one character set is selected
      if (characterPool === "") {
        passwordDisplay.value = "Select at least one character type"
        if (generateButton) generateButton.disabled = true // Disable button if no types selected
        if (strengthFill) strengthFill.className = "strength-meter-fill"
        if (strengthText) strengthText.textContent = "Password strength"
        return
      } else {
        if (generateButton) generateButton.disabled = false // Re-enable if types are selected
      }
  
      // Ensure password contains at least one char from each selected type
      let guaranteedChars = ""
      if (uppercaseCheckbox && uppercaseCheckbox.checked)
        guaranteedChars += CHARSETS.uppercase[Math.floor(Math.random() * CHARSETS.uppercase.length)]
      if (lowercaseCheckbox && lowercaseCheckbox.checked)
        guaranteedChars += CHARSETS.lowercase[Math.floor(Math.random() * CHARSETS.lowercase.length)]
      if (numbersCheckbox && numbersCheckbox.checked)
        guaranteedChars += CHARSETS.numbers[Math.floor(Math.random() * CHARSETS.numbers.length)]
      if (symbolsCheckbox && symbolsCheckbox.checked)
        guaranteedChars += CHARSETS.symbols[Math.floor(Math.random() * CHARSETS.symbols.length)]
  
      // Adjust length for guaranteed characters
      const remainingLength = length - guaranteedChars.length
  
      // Generate the rest of the password
      for (let i = 0; i < remainingLength; i++) {
        const randomIndex = Math.floor(Math.random() * characterPool.length)
        generatedPassword += characterPool[randomIndex]
      }
  
      // Combine guaranteed chars with the rest and shuffle
      generatedPassword = (generatedPassword + guaranteedChars)
        .split("")
        .sort(() => 0.5 - Math.random()) // Shuffle array
        .join("")
  
      passwordDisplay.value = generatedPassword
  
      // Update strength meter
      if (strengthFill && strengthText) {
        const strength = evaluatePasswordStrength(generatedPassword)
        strengthFill.className = "strength-meter-fill " + strength.class
        strengthText.textContent = strength.label
      }
    }
  
    // --- Event Listeners ---
    if (lengthSlider && lengthValue) {
      lengthSlider.addEventListener("input", () => {
        lengthValue.textContent = lengthSlider.value
        generatePassword() // Regenerate on length change
      })
    }
    // Add listeners to checkboxes to regenerate password and check validity
    ;[uppercaseCheckbox, lowercaseCheckbox, numbersCheckbox, symbolsCheckbox].forEach((checkbox) => {
      if (checkbox) {
        checkbox.addEventListener("change", generatePassword)
      }
    })
  
    if (generateButton) {
      generateButton.addEventListener("click", generatePassword)
    }
  
    if (copyButton && passwordDisplay) {
      copyButton.addEventListener("click", () => {
        if (!passwordDisplay.value || passwordDisplay.value.startsWith("Select")) return // Don't copy placeholder/error
  
        try {
          navigator.clipboard
            .writeText(passwordDisplay.value)
            .then(() => {
              // Visual feedback
              copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              `
              copyButton.style.color = "#10b981" // Success green color
  
              setTimeout(() => {
                copyButton.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                `
                copyButton.style.color = "" // Reset color
              }, 1500) // Reset after 1.5 seconds
            })
            .catch(() => {
              // Silently handle clipboard errors
            })
        } catch (e) {
          // Silently handle any clipboard errors
        }
      })
    }
  
    // --- Initialisation ---
    if (lengthValue && lengthSlider) {
      lengthValue.textContent = lengthSlider.value // Set initial length display
    }
  
    // Generate initial password on load
    try {
      generatePassword()
    } catch (e) {
      // Silently handle any errors during initial password generation
    }
  })
  
  // Replace the line:
  // if (process.env.NODE_ENV === "production") {
  //   console.error = () => {}
  // }
  
  // With this safer browser-compatible approach:
  // Suppress console errors in production
  // We'll use a more browser-friendly approach since process is not defined in browser context
  const suppressErrors = () => {
    // Only suppress in production environments
    // Check if we're in a production environment by looking at the URL or other indicators
    const isProduction =
      !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")
  
    if (isProduction) {
      // Create a no-op function for console.error
      const originalConsoleError = console.error
      console.error = () => {
        // You could optionally log to an error tracking service here
        // But we'll just silently ignore errors in production
        return
      }
    }
  }
  
  // Call the function to set up error suppression
  suppressErrors()
  
  // Handle DNS records functionality separately
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // Find elements with null checks
      const loader = document.querySelector(".loader")
      const currentSite = document.querySelector(".current-site")
      const recordBoxes = document.querySelectorAll(".record-box")
      const tabs = document.querySelectorAll(".tab")
      const countElements = {
        a: document.getElementById("a-count"),
        www: document.getElementById("www-count"),
        ns: document.getElementById("ns-count"),
        mx: document.getElementById("mx-count"),
        txt: document.getElementById("txt-count"),
      }
  
      // Only proceed if we're in the DNS records extension
      if (!loader && !currentSite && (!recordBoxes || recordBoxes.length === 0)) {
        return // Not in DNS records extension
      }
  
      // Tab switching functionality
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          // Remove active class from all tabs and record boxes
          tabs.forEach((t) => t.classList.remove("active"))
          recordBoxes.forEach((box) => box.classList.remove("active"))
  
          // Add active class to clicked tab
          tab.classList.add("active")
  
          // Show corresponding record box
          const tabName = tab.getAttribute("data-tab")
          let recordBox
  
          switch (tabName) {
            case "a":
              recordBox = document.getElementById("a-records")
              break
            case "www":
              recordBox = document.getElementById("www-records")
              break
            case "ns":
              recordBox = document.getElementById("ns-records")
              break
            case "mx":
              recordBox = document.getElementById("mx-records")
              break
            case "txt":
              recordBox = document.getElementById("txt-records")
              break
          }
  
          if (recordBox) {
            recordBox.classList.add("active")
          }
        })
      })
  
      // Check if chrome is defined, if not, mock it for testing/non-extension environments
      if (typeof chrome === "undefined" || !chrome.tabs) {
        console.warn("Chrome API not available. Using mock implementation.")
        window.chrome = {
          tabs: {
            query: (options) => {
              return new Promise((resolve) => {
                // Mock implementation: return a default tab object
                resolve([{ url: "https://example.com" }])
              })
            },
          },
        }
      }
  
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  
        // Safely create URL object with error handling
        let url
        try {
          url = new URL(tab.url)
        } catch (e) {
          // If URL construction fails, use a default URL
          url = new URL("https://example.com")
        }
  
        // Extract the hostname and remove 'www.' if present
        let hostname = url.hostname
        const displayHostname = hostname // Keep the original hostname for display
  
        // Strip 'www.' prefix for DNS queries to always query the root domain
        if (hostname.startsWith("www.")) {
          hostname = hostname.substring(4)
        }
  
        // Display the original hostname in the UI
        if (currentSite) {
          currentSite.textContent = displayHostname
        }
  
        async function fetchDNSRecords(recordType) {
          try {
            // First try with default DNS settings
            let response = await fetch(`https://dns.google/resolve?name=${hostname}&type=${recordType}`)
            let data = await response.json()
  
            // Check for all Turkish domain extensions
            const trDomains = [".tr", ".com.tr", ".net.tr", ".org.tr", ".web.tr", ".gen.tr", ".av.tr"]
            const isTrDomain = trDomains.some((ext) => hostname.toLowerCase().endsWith(ext))
  
            // If no answer and it's a Turkish domain, try with specific settings
            if ((!data.Answer || data.Answer.length === 0) && isTrDomain) {
              response = await fetch(`https://dns.google/resolve?name=${hostname}&type=${recordType}&cd=true&do=true`)
              data = await response.json()
  
              // If still no answer, try with nameserver for .tr domains
              if (!data.Answer || data.Answer.length === 0) {
                response = await fetch(
                  `https://dns.google/resolve?name=${hostname}&type=${recordType}&cd=true&do=true&edns_client_subnet=0.0.0.0/0`,
                )
                data = await response.json()
              }
            }
  
            return data.Answer || []
          } catch (error) {
            // Silently handle DNS fetch errors
            return []
          }
        }
  
        // Special function to fetch WWW record (CNAME for www.domain.com)
        async function fetchWWWRecord() {
          try {
            // For WWW records, we specifically query for www.hostname
            const wwwHostname = `www.${hostname}`
            let response = await fetch(`https://dns.google/resolve?name=${wwwHostname}&type=CNAME`)
            let data = await response.json()
  
            // If no CNAME record, try A record (some sites use A records for www)
            if (!data.Answer || data.Answer.length === 0) {
              response = await fetch(`https://dns.google/resolve?name=${wwwHostname}&type=A`)
              data = await response.json()
            }
  
            return data.Answer || []
          } catch (error) {
            // Silently handle WWW record fetch errors
            return []
          }
        }
  
        // Update the displayRecords function to handle TXT records differently
        function displayRecords(records, type, countElement) {
          let contentElement
  
          switch (type) {
            case "A":
              contentElement = document.querySelector("#a-records .record-content")
              if (countElement) countElement.textContent = records.length
              break
            case "WWW":
              contentElement = document.querySelector("#www-records .record-content")
              if (countElement) countElement.textContent = records.length
              break
            case "NS":
              contentElement = document.querySelector("#ns-records .record-content")
              if (countElement) countElement.textContent = records.length
              break
            case "MX":
              contentElement = document.querySelector("#mx-records .record-content")
              if (countElement) countElement.textContent = records.length
              break
            case "TXT":
              contentElement = document.querySelector("#txt-records .record-content")
              if (countElement) countElement.textContent = records.length
              break
          }
  
          if (!contentElement || !records.length) {
            if (contentElement) contentElement.innerHTML = ""
            return
          }
  
          contentElement.innerHTML = records
            .map((record) => {
              let data = record.data
  
              if (type === "MX") {
                const [priority, server] = data.split(" ")
                data = `${server} (${priority})`
              }
  
              // Format TXT records for better display
              if (type === "TXT") {
                // Remove quotes if they exist at the beginning and end
                if (data.startsWith('"') && data.endsWith('"')) {
                  data = data.substring(1, data.length - 1)
                }
              }
  
              return `<div class="record-item">
                        <div class="record-data">${data}</div>
                        <div class="ttl">TTL: ${record.TTL}s</div>
                      </div>`
            })
            .join("")
        }
  
        // Only fetch and display records if we're in the DNS records extension
        if (countElements.a || countElements.www || countElements.ns || countElements.mx || countElements.txt) {
          // Fetch and display records
          const aRecords = await fetchDNSRecords("A")
          displayRecords(aRecords, "A", countElements.a)
  
          const wwwRecords = await fetchWWWRecord()
          displayRecords(wwwRecords, "WWW", countElements.www)
  
          const nsRecords = await fetchDNSRecords("NS")
          displayRecords(nsRecords, "NS", countElements.ns)
  
          const mxRecords = await fetchDNSRecords("MX")
          displayRecords(mxRecords, "MX", countElements.mx)
  
          const txtRecords = await fetchDNSRecords("TXT")
          displayRecords(txtRecords, "TXT", countElements.txt)
        }
      } catch (error) {
        // Silently handle any errors
      } finally {
        // Hide loader if it exists
        if (loader) {
          loader.style.display = "none"
        }
      }
    } catch (error) {
      // Silently handle any errors in the DNS records functionality
    }
  })
  