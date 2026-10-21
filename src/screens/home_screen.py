import streamlit as st
from src.components.header import header_home
from src.components.footer import footer_home

from src.ui.base_layout import style_base_layout, style_background_home


# =========================================================
# ORIGINAL MASCOTS (inline SVG, no copyright, no downloads)
# Colors follow the active theme via CSS variables
# =========================================================
_MASCOT_CSS = """
<style>
    .fv-mascot {
        display: flex;
        justify-content: center;
        margin: .4rem 0 1rem;
    }
    .fv-mascot svg {
        width: 150px;
        height: 150px;
        filter: drop-shadow(0 10px 14px rgba(0, 0, 0, .22));
        animation: fvFloat 3.5s ease-in-out infinite;
    }
    @keyframes fvFloat {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-8px); }
    }
</style>
"""

_STUDENT_SVG = """
<div class="fv-mascot">
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Student mascot">
  <circle cx="100" cy="100" r="96" fill="var(--fv-accent, #5865F2)" opacity=".16"/>
  <path d="M38 200 Q38 142 100 142 Q162 142 162 200Z" fill="var(--fv-accent, #5865F2)"/>
  <rect x="88" y="124" width="24" height="22" rx="8" fill="#F2C29B"/>
  <circle cx="100" cy="92" r="46" fill="#FFD9B8"/>
  <path d="M52 90 Q48 38 100 38 Q152 38 148 90 Q132 60 100 60 Q68 60 52 90Z" fill="#3B2A24"/>
  <circle cx="82" cy="98" r="6" fill="#23272A"/><circle cx="118" cy="98" r="6" fill="#23272A"/>
  <circle cx="84" cy="96" r="2" fill="#fff"/><circle cx="120" cy="96" r="2" fill="#fff"/>
  <circle cx="68" cy="112" r="7" fill="#FF8FA3" opacity=".55"/><circle cx="132" cy="112" r="7" fill="#FF8FA3" opacity=".55"/>
  <path d="M86 116 Q100 130 114 116" fill="none" stroke="#23272A" stroke-width="4" stroke-linecap="round"/>
  <rect x="66" y="158" width="68" height="38" rx="6" fill="#FFFFFF"/>
  <rect x="66" y="158" width="10" height="38" rx="4" fill="var(--fv-accent2, #EB459E)"/>
  <path d="M86 170 H124 M86 180 H116" stroke="#C9CDD8" stroke-width="3" stroke-linecap="round"/>
</svg>
</div>
"""

_TEACHER_SVG = """
<div class="fv-mascot">
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Teacher mascot">
  <circle cx="100" cy="100" r="96" fill="var(--fv-accent2, #EB459E)" opacity=".16"/>
  <path d="M34 200 Q34 144 100 144 Q166 144 166 200Z" fill="var(--fv-accent2, #EB459E)"/>
  <path d="M84 146 L100 176 L116 146Z" fill="#FFFFFF"/>
  <path d="M100 160 L94 196 L106 196Z" fill="var(--fv-accent, #5865F2)"/>
  <rect x="88" y="126" width="24" height="22" rx="8" fill="#E0A97E"/>
  <circle cx="100" cy="98" r="44" fill="#F3C9A1"/>
  <path d="M56 92 Q52 56 100 56 Q148 56 144 92 Q128 70 100 70 Q72 70 56 92Z" fill="#6B4A3A"/>
  <circle cx="82" cy="102" r="14" fill="none" stroke="#23272A" stroke-width="4"/>
  <circle cx="118" cy="102" r="14" fill="none" stroke="#23272A" stroke-width="4"/>
  <path d="M96 102 H104" stroke="#23272A" stroke-width="4"/>
  <circle cx="82" cy="103" r="4.5" fill="#23272A"/><circle cx="118" cy="103" r="4.5" fill="#23272A"/>
  <path d="M88 124 Q100 134 112 124" fill="none" stroke="#23272A" stroke-width="4" stroke-linecap="round"/>
  <path d="M54 56 L100 34 L146 56 L100 78Z" fill="#23272A"/>
  <path d="M146 56 V82" stroke="#FFC857" stroke-width="3"/><circle cx="146" cy="86" r="5" fill="#FFC857"/>
</svg>
</div>
"""


def mascot_student():
    st.markdown(_MASCOT_CSS + _STUDENT_SVG, unsafe_allow_html=True)


def mascot_teacher():
    st.markdown(_MASCOT_CSS + _TEACHER_SVG, unsafe_allow_html=True)


# =========================================================
# HOME SCREEN
# =========================================================
def home_screen():

    header_home()
    style_background_home()
    style_base_layout()

    col1, col2 = st.columns(2)

    with col1:
        st.header("Student")
        mascot_student()
        if st.button('Student Portal', type='secondary',
                     icon=':material/arrow_outward:', icon_position='right'):
            st.session_state['login_type'] = 'student'
            st.rerun()

    with col2:
        st.header("Teacher")
        mascot_teacher()
        if st.button('Teacher Portal', type='secondary',
                     icon=':material/arrow_outward:', icon_position='right'):
            st.session_state['login_type'] = 'teacher'
            st.rerun()

    footer_home()