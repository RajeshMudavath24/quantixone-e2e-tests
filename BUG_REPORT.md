# Bug Report - QuantixOne QA Assessment

## BUG-001
**Title:** Horizontal overflow visible on mobile hero section  
**Steps:**  
1. Open `https://quantixone.com` on mobile viewport `375x812`  
2. Scroll horizontally on first viewport  
**Expected:** No horizontal scroll; page width remains within viewport  
**Actual:** Horizontal overflow appears intermittently, especially around hero CTA blocks  
**Severity:** Medium  
**Browser:** Chromium, WebKit  
**Viewport:** 375x812  

## BUG-002
**Title:** Tablet layout exceeds viewport tolerance on selected sections  
**Steps:**  
1. Open homepage at viewport `768x1024`  
2. Inspect body width and section containers  
**Expected:** `body.scrollWidth <= viewport + 30px`  
**Actual:** In Firefox, some content containers exceed viewport tolerance  
**Severity:** Medium  
**Browser:** Firefox  
**Viewport:** 768x1024  

## BUG-003
**Title:** Demo booking iframe has delayed interactive readiness  
**Steps:**  
1. Open homepage and click `Book a Demo`  
2. Wait for Calendly iframe and attempt immediate interaction  
**Expected:** Form fields become interactive within a few seconds  
**Actual:** Date/time and details fields can take significant extra time before becoming interactive  
**Severity:** Medium  
**Browser:** Chromium, Firefox, WebKit  
**Viewport:** 1280x720  

## BUG-004
**Title:** Chatbot launcher/panel availability is inconsistent  
**Steps:**  
1. Open homepage and wait for chatbot launcher  
2. Attempt to open chatbot panel  
**Expected:** Chatbot launcher is always visible and panel opens consistently  
**Actual:** Launcher is intermittently absent or delayed; panel open state is inconsistent across runs  
**Severity:** Medium  
**Browser:** Firefox, WebKit  
**Viewport:** 1280x720  

## BUG-005
**Title:** Firefox page load completion occasionally exceeds target threshold  
**Steps:**  
1. Run performance test on homepage in Firefox  
2. Capture navigation timing `loadEventEnd`  
**Expected:** Load completion under 8000ms in normal network conditions  
**Actual:** Some runs exceed the target threshold, indicating performance inconsistency  
**Severity:** Low  
**Browser:** Firefox  
**Viewport:** 1920x1080  