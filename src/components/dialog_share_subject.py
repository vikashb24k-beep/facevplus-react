import streamlit as st
import segno
import io
@st.dialog("Share Class Link")
def share_subject_dialog(subject_code, subject_name):
    app_domain = "facevplus-v2.streamlit.app"
    join_url = f"{app_domain}/?join-code={subject_code}"

    st.header(f"Share {subject_name}")
    st.caption(f"Subject Code: {subject_code}")

    qr = segno.make(join_url)

    out = io.BytesIO()
    qr.save(out, kind="png", scale=10, border=1)

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### Copy Link")
        st.code(join_url, language="text")
        st.code(subject_code, language="text")
        st.info("Copy this link and share it on WhatsApp or email.")

        if st.button("Copy link", use_container_width=True):
            st.code(join_url)

    with col2:
        st.markdown("### Scan to join")
        st.image(out.getvalue(), caption="QR code for class joining")
