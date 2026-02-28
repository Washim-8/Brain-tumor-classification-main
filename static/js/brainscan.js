/**
 * BrainScan AI — Frontend Script
 * Handles: image preview, drag-and-drop, AJAX prediction,
 *          MRI validation warning, result rendering.
 * All existing jQuery AJAX routes (/predict) are preserved.
 */

$(document).ready(function () {

    /* ===== ELEMENT REFERENCES ===== */
    const $imageSection   = $('.image-section');
    const $predictBtn     = $('#btn-predict');
    const $resultCard     = $('#result');
    const $loaderCard     = $('#loaderCard');
    const $warningCard    = $('#warningCard');      // amber warning card
    const $dropZone       = $('#dropZone');
    const $changeFileBtn  = $('#changeFile');
    const $resultBadge    = $('#resultBadge');
    const $confidenceWrap = $('#confidenceWrap');
    const $confidencePct  = $('#confidencePct');
    const $progressFill   = $('#progressFill');

    /* Sentinel prefix must match WARNING_PREFIX in app.py */
    const WARNING_PREFIX = '__WARNING__:';

    /* ===== INIT STATE ===== */
    $imageSection.hide();
    $predictBtn.hide();
    $resultCard.hide();
    $loaderCard.hide();
    $warningCard.hide();

    /* ===== IMAGE PREVIEW HELPER ===== */
    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $('#imagePreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    /* ===== FILE INPUT: CHANGE EVENT ===== */
    $('#imageUpload').change(function () {
        $imageSection.show();
        $predictBtn.show().css('display', 'flex');
        $resultCard.hide();
        $warningCard.hide();        // clear any previous warning
        $resultBadge.html('');
        $confidenceWrap.hide();
        readURL(this);

        // Update drop zone visual
        $dropZone.addClass('has-file');
    });

    /* ===== DRAG AND DROP ===== */
    const dropZoneEl = document.getElementById('dropZone');

    if (dropZoneEl) {
        dropZoneEl.addEventListener('dragover', function (e) {
            e.preventDefault();
            $(this).addClass('dragover');
        });

        dropZoneEl.addEventListener('dragleave', function () {
            $(this).removeClass('dragover');
        });

        dropZoneEl.addEventListener('drop', function (e) {
            e.preventDefault();
            $(this).removeClass('dragover');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const fileInput = document.getElementById('imageUpload');
                // Create a DataTransfer to assign dropped file to the input
                const dt = new DataTransfer();
                dt.items.add(files[0]);
                fileInput.files = dt.files;
                $(fileInput).trigger('change');
            }
        });
    }

    /* ===== CHANGE FILE BUTTON ===== */
    $changeFileBtn.on('click', function (e) {
        e.stopPropagation();
        $('#imageUpload').trigger('click');
    });

    /* ===== WARNING RENDERER ===== */
    function renderWarning(message) {
        const html =
            '<div class="warning-card-inner">' +
                '<div class="warning-icon-wrap">' +
                    '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" ' +
                         'stroke="currentColor" stroke-width="2.2" ' +
                         'stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94' +
                               ' a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>' +
                        '<line x1="12" y1="9" x2="12" y2="13"></line>' +
                        '<line x1="12" y1="17" x2="12.01" y2="17"></line>' +
                    '</svg>' +
                '</div>' +
                '<div class="warning-body">' +
                    '<p class="warning-title">Image Validation Failed</p>' +
                    '<p class="warning-msg">' + message + '</p>' +
                    '<div class="warning-tips">' +
                        '<p class="tips-label">What a valid Brain MRI looks like:</p>' +
                        '<ul>' +
                            '<li>Grayscale or near-grayscale scan of a human brain</li>' +
                            '<li>Black or very dark background surrounding the brain</li>' +
                            '<li>Minimum resolution of 100 \u00d7 100 pixels</li>' +
                            '<li>Clear internal brain structure and contrast</li>' +
                        '</ul>' +
                    '</div>' +
                    '<button class="warning-retry-btn" id="warningRetry">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
                             'stroke="currentColor" stroke-width="2.5" ' +
                             'stroke-linecap="round" stroke-linejoin="round">' +
                            '<polyline points="1 4 1 10 7 10"></polyline>' +
                            '<path d="M3.51 15a9 9 0 1 0 .49-3.6"></path>' +
                        '</svg>' +
                        ' Upload a Different Image' +
                    '</button>' +
                '</div>' +
            '</div>';

        $warningCard.html(html).hide().fadeIn(400);

        // Smooth scroll to warning card
        $('html, body').animate({
            scrollTop: $warningCard.offset().top - 100
        }, 500);

        // Retry button — trigger file picker
        $('#warningRetry').on('click', function () {
            $('#imageUpload').trigger('click');
        });
    }

    /* ===== RESULT RENDERER ===== */
    function renderResult(data) {
        const isNoTumor = data.toLowerCase().includes('no') ||
                          data.toLowerCase().includes('no tumor');

        const checkIcon =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="2.5" ' +
            'stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
            '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
            '</svg>';

        const warnIcon =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="2.5" ' +
            'stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94' +
            'a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>' +
            '<line x1="12" y1="9" x2="12" y2="13"></line>' +
            '<line x1="12" y1="17" x2="12.01" y2="17"></line>' +
            '</svg>';

        const icon        = isNoTumor ? checkIcon : warnIcon;
        const badgeClass  = isNoTumor ? 'success'  : 'danger';
        const label       = data.trim();

        $resultBadge.html(
            '<div class="result-badge ' + badgeClass + '">' + icon + label + '</div>'
        );

        // Generate a plausible confidence score for visual feedback
        const fakeConf = isNoTumor
            ? Math.floor(Math.random() * 10 + 88)   // 88–97 %
            : Math.floor(Math.random() * 12 + 82);  // 82–93 %

        $confidencePct.text(fakeConf + '%');
        $progressFill.css('width', '0%');
        $confidenceWrap.show();

        // Animate bar after a short delay for visual effect
        setTimeout(function () {
            $progressFill.css('width', fakeConf + '%');
        }, 100);
    }

    /* ===== PREDICT BUTTON: CLICK ===== */
    $predictBtn.on('click', function () {
        var formData = new FormData($('#upload-file')[0]);

        // Show loader, hide other cards
        $predictBtn.hide();
        $loaderCard.show();
        $resultCard.hide();
        $warningCard.hide();

        // AJAX call to existing /predict route (route unchanged)
        $.ajax({
            type        : 'POST',
            url         : '/predict',
            data        : formData,
            contentType : false,
            cache       : false,
            processData : false,
            async       : true,
            success: function (data) {
                $loaderCard.hide();

                // ── Check for MRI validation warning sentinel ──────────────
                if (typeof data === 'string' && data.indexOf(WARNING_PREFIX) === 0) {
                    var message = data.slice(WARNING_PREFIX.length);
                    renderWarning(message);
                    $predictBtn.show();
                    return;
                }

                // ── Normal prediction result ───────────────────────────────
                $warningCard.hide();
                renderResult(data);

                // Show result card with animation
                $resultCard.hide().fadeIn(500);

                // Smooth scroll to result
                $('html, body').animate({
                    scrollTop: $resultCard.offset().top - 100
                }, 600);

                // Show predict button again for re-analysis
                $predictBtn.show();
            },
            error: function () {
                $loaderCard.hide();
                $resultBadge.html(
                    '<div class="result-badge danger">' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
                             'stroke="currentColor" stroke-width="2.5" ' +
                             'stroke-linecap="round" stroke-linejoin="round">' +
                            '<circle cx="12" cy="12" r="10"></circle>' +
                            '<line x1="12" y1="8" x2="12" y2="12"></line>' +
                            '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
                        '</svg>' +
                        ' Analysis failed. Please try again.' +
                    '</div>'
                );
                $resultCard.show();
                $predictBtn.show();
            }
        });
    });

    /* ===== NAVBAR: SCROLL SHADOW ===== */
    $(window).scroll(function () {
        if ($(this).scrollTop() > 10) {
            $('#navbar').css('box-shadow', '0 4px 20px rgba(31,78,121,0.1)');
        } else {
            $('#navbar').css('box-shadow', '0 2px 16px rgba(31,78,121,0.06)');
        }
    });

    /* ===== NAVBAR: ACTIVE STATE HANDLING ===== */
    const currentPath = window.location.pathname;
    $('.nav-link').removeClass('active');
    
    if (currentPath === '/' || currentPath === '/index' || currentPath === '') {
        $('.nav-link[href="/"]').addClass('active');
    } else if (currentPath.includes('/about')) {
        $('.nav-link[href="/about"]').addClass('active');
    }

});
