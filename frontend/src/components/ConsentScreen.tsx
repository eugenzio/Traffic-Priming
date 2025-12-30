import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { pageVariants, pageVariantsReduced, fadeUpVariants, fadeUpVariantsReduced, staggerContainer } from '../motion/tokens'

interface ConsentScreenProps {
  onAgree: () => void
  onDecline: () => void
}

export default function ConsentScreen({ onAgree, onDecline }: ConsentScreenProps) {
  const prefersReducedMotion = useReducedMotion()
  const [hasRead, setHasRead] = useState(false)

  const containerVariants = prefersReducedMotion ? {} : staggerContainer
  const itemVariants = prefersReducedMotion ? fadeUpVariantsReduced : fadeUpVariants

  return (
    <motion.main
      className="page"
      variants={prefersReducedMotion ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        style={{ marginBottom: 'var(--space-6)' }}
        variants={itemVariants}
        initial="initial"
        animate="animate"
      >
        <h1 style={{ margin: 0 }}>Informed Consent</h1>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="section" variants={itemVariants}>
          <div className="card">
            <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }} onScroll={(e) => {
              const element = e.currentTarget
              const hasScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10
              if (hasScrolledToBottom) setHasRead(true)
            }}>
              <h2 style={{ marginTop: 0 }}>연구 참여 동의서</h2>

              <h3>연구 제목</h3>
              <p>좌회전 교차로 상황에서의 의사결정 연구</p>

              <h3>연구 목적</h3>
              <p>
                본 연구는 운전자가 좌회전 교차로 상황에서 어떻게 의사결정을 내리는지 이해하기 위한
                학술 연구입니다. 귀하는 다양한 교통 상황이 제시되며, 각 상황에서 좌회전 또는 대기 중
                하나를 선택하게 됩니다.
              </p>

              <h3>연구 절차</h3>
              <p>본 실험은 다음과 같이 진행됩니다:</p>
              <ol>
                <li>인구통계학적 정보 수집 (연령, 성별, 운전 경험, 거주 지역)</li>
                <li>실험 안내 및 과제 설명</li>
                <li>연습 시행 (3회)</li>
                <li>본 실험 시행 (약 21회)</li>
                <li>피드백 제공</li>
              </ol>
              <p>전체 실험은 약 <strong>10-15분</strong> 소요됩니다.</p>

              <h3>데이터의 익명성 보장</h3>
              <p>
                귀하의 개인 식별 정보(이름, 이메일 주소 등)는 수집되지 않습니다.
                모든 데이터는 익명으로 처리되며, 연구 목적으로만 사용됩니다.
                수집된 데이터는 안전하게 암호화되어 저장됩니다.
              </p>

              <h3>자발적 참여 및 중도 포기 권리</h3>
              <p>
                본 연구 참여는 완전히 자발적입니다. 귀하는 언제든지 아무런 불이익 없이
                실험을 중단할 수 있습니다. 브라우저를 닫으면 실험이 자동으로 종료됩니다.
              </p>

              <h3>연구 책임자 정보</h3>
              <p>
                본 연구에 대해 질문이 있으시면 아래로 연락 주시기 바랍니다:
              </p>
              <ul>
                <li>연구 책임자: [연구자 이름]</li>
                <li>소속 기관: [대학/연구소 이름]</li>
                <li>이메일: [연구자 이메일]</li>
              </ul>

              <div style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-4)',
                background: 'var(--panel)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--accent)'
              }}>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  위의 내용을 충분히 읽고 이해하였으며, 본 연구에 자발적으로 참여하는 것에 동의합니다.
                </p>
              </div>

              {!hasRead && (
                <p className="help" style={{ marginTop: 'var(--space-4)', textAlign: 'center', color: 'var(--warning-fg)' }}>
                  ⬇ 하단까지 스크롤하여 모든 내용을 확인해주세요
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="section"
          variants={itemVariants}
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={onAgree}
            className="btn btn-primary"
            disabled={!hasRead}
            style={{
              fontSize: 'var(--fs-lg)',
              padding: 'var(--space-3) var(--space-6)',
              minWidth: '180px'
            }}
          >
            동의함 (I Agree)
          </button>
          <button
            onClick={onDecline}
            className="btn"
            style={{
              fontSize: 'var(--fs-lg)',
              padding: 'var(--space-3) var(--space-6)',
              minWidth: '180px',
              background: 'var(--panel)',
              color: 'var(--fg-muted)'
            }}
          >
            동의하지 않음 (Decline)
          </button>
        </motion.div>
      </motion.div>
    </motion.main>
  )
}
