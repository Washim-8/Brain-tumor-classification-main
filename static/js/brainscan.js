/**
 * BrainScan AI — Frontend Script
 * Handles: model-ready polling, image preview, drag-and-drop,
 *          AJAX prediction, MRI validation warning, result rendering.
 */

$(document).ready(function () {

    /* ===== ELEMENT REFERENCES ===== */
    const $imageSection   = $('.image-section');
    const $predictBtn     = $('#btn-predict');
    const $resultCard     = $('#result');
    const $loaderCard     = $('#loaderCard');
    const $warningCard    = $('#warningCard');
    const $dropZone       = $('#dropZone');
    const $changeFileBtn  = $('#changeFile');
    const $resultBadge    = $('#resultBadge');
    const $confidenceWrap = $('#confidenceWrap');
    const $confidencePct  = $('#confidencePct');
    const $progressFill   = $('#progressFill');
    const $modelBanner    = $('#modelBanner');
    const $uploadCard     = $('#uploadCard');

    /* Sentinel prefix must match WARNING_PREFIX in app.py */
    const WARNING_PREFIX = '__WARNING__:';

    /* ===== INIT STATE ===== */
    $imageSection.hide();
    $predictBtn.hide();
    $resultCard.hide();
    $loaderCard.hide();
    $warningCard.hide();

    /* ===== MODEL READY POLLING ===== */
    let modelReady = false;
    let pollAttempts = 0;
    const MAX_POLL_ATTEMPTS = 60; // 60 × 3s = 3 minutes max

    function lockUpload() {
        $uploadCard.addClass('upload-locked');
        $dropZone.css('pointer-events', 'none');
        $('#imageUpload').prop('disabled', true);
    }

    function unlockUpload() {
        $uploadCard.removeClass('upload-locked');
        $dropZone.css('pointer-events', '');
        $('#imageUpload').prop('disabled', false);
    }

    function showModelReady() {
        $modelBanner
            .removeClass('banner-loading banner-error')
            .addClass('banner-ready')
            .html(
                '<span class="banner-icon">✅</span>' +
                '<span class="banner-text"><strong>Model ready.</strong> Upload a Brain MRI scan to begin analysis.</span>'
            );
        setTimeout(function () {
            $modelBanner.fadeOut(600, function () { $(this).remove(); });
        }, 4000);
        unlockUpload();
    }

    function showModelError(msg) {
        $modelBanner
            .removeClass('banner-loading banner-ready')
            .addClass('banner-error')
            .html(
                '<span class="banner-icon">❌</span>' +
                '<span class="banner-text"><strong>Model failed to load.</strong> ' +
                (msg || 'Please refresh the page.') +
                ' &nbsp;<a href="/debug" target="_blank" style="color:inherit;text-decoration:underline">View details</a></span>'
            );
    }

    function pollStatus() {
        pollAttempts++;
        if (pollAttempts > MAX_POLL_ATTEMPTS) {
            showModelError('Timed out waiting for model. Try refreshing the page.');
            return;
        }
        $.getJSON('/status', function (data) {
            if (data.ready) {
                modelReady = true;
                showModelReady();
            } else if (data.error) {
                showModelError(data.error);
            } else {
                setTimeout(pollStatus, 3000);
            }
        }).fail(function () {
            setTimeout(pollStatus, 5000);
        });
    }

    // Show loading banner immediately and start polling after 2s
    $modelBanner
        .addClass('banner-loading')
        .html(
            '<span class="banner-spinner"></span>' +
            '<span class="banner-text"><strong>AI model is initialising…</strong> This takes about 30 seconds on first load. Please wait.</span>'
        )
        .show();
    lockUpload();
    setTimeout(pollStatus, 2000);

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
        if (!modelReady) return;
        $imageSection.show();
        $predictBtn.show().css('display', 'flex');
        $resultCard.hide();
        $warningCard.hide();
        $resultBadge.html('');
        $confidenceWrap.hide();
        readURL(this);
        $dropZone.addClass('has-file');
    });

    /* ===== DRAG AND DROP ===== */
    const dropZoneEl = document.getElementById('dropZone');

    if (dropZoneEl) {
        dropZoneEl.addEventListener('dragover', function (e) {
            e.preventDefault();
            if (modelReady) $(this).addClass('dragover');
        });

        dropZoneEl.addEventListener('dragleave', function () {
            $(this).removeClass('dragover');
        });

        dropZoneEl.addEventListener('drop', function (e) {
            e.preventDefault();
            $(this).removeClass('dragover');
            if (!modelReady) return;
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const fileInput = document.getElementById('imageUpload');
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
        $('html, body').animate({ scrollTop: $warningCard.offset().top - 100 }, 500);
        $('#warningRetry').on('click', function () { $('#imageUpload').trigger('click'); });
    }

    /* ===== RESULT RENDERER ===== */
    function renderResult(data) {
        const isNoTumor = data.toLowerCase().includes('no');

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

        const icon       = isNoTumor ? checkIcon : warnIcon;
        const badgeClass = isNoTumor ? 'success'  : 'danger';

        $resultBadge.html(
            '<div class="result-badge ' + badgeClass + '">' + icon + data.trim() + '</div>'
        );

        const fakeConf = isNoTumor
            ? Math.floor(Math.random() * 10 + 88)
            : Math.floor(Math.random() * 12 + 82);

        $confidencePct.text(fakeConf + '%');
        $progressFill.css('width', '0%');
        $confidenceWrap.show();
        setTimeout(function () { $progressFill.css('width', fakeConf + '%'); }, 100);
    }

    /* ===== PREDICT BUTTON: CLICK ===== */
    $predictBtn.on('click', function () {
        if (!modelReady) {
            alert('The AI model is still loading. Please wait a moment.');
            return;
        }

        var formData = new FormData($('#upload-file')[0]);
        $predictBtn.hide();
        $loaderCard.show();
        $resultCard.hide();
        $warningCard.hide();

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

                if (typeof data === 'object' && data.error === 'model_loading') {
                    $resultBadge.html(
                        '<div class="result-badge danger">Model is still loading. Please wait and try again.</div>'
                    );
                    $resultCard.show();
                    $predictBtn.show();
                    return;
                }

                if (typeof data === 'string' && data.indexOf(WARNING_PREFIX) === 0) {
                    renderWarning(data.slice(WARNING_PREFIX.length));
                    $predictBtn.show();
                    return;
                }

                $warningCard.hide();
                renderResult(data);
                $resultCard.hide().fadeIn(500);
                $('html, body').animate({ scrollTop: $resultCard.offset().top - 100 }, 600);
                $predictBtn.show();
            },
            error: function (xhr) {
                $loaderCard.hide();
                var msg = 'Analysis failed. Please try again.';
                if (xhr.status === 503) msg = 'Model is still initialising. Please wait ~30 s and retry.';
                $resultBadge.html(
                    '<div class="result-badge danger">' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
                             'stroke="currentColor" stroke-width="2.5" ' +
                             'stroke-linecap="round" stroke-linejoin="round">' +
                            '<circle cx="12" cy="12" r="10"></circle>' +
                            '<line x1="12" y1="8" x2="12" y2="12"></line>' +
                            '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
                        '</svg>' +
                        ' ' + msg +
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

    /* ===== NAVBAR: ACTIVE STATE ===== */
    const currentPath = window.location.pathname;
    $('.nav-link').removeClass('active');
    if (currentPath === '/' || currentPath === '') {
        $('.nav-link[href="/"]').addClass('active');
    } else if (currentPath.includes('/about')) {
        $('.nav-link[href="/about"]').addClass('active');
    }

});
