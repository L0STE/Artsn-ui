import React from 'react'
import { EmblaOptionsType } from 'embla-carousel'
import { DotButton, useDotButton } from './EmblaCarouselDotButtons'
import {
  PrevButton,
  NextButton,
  usePrevNextButtons
} from './EmblaCarouselArrowButtons'
import useEmblaCarousel from 'embla-carousel-react'
import '@/styles/carousel.css'
import Image from "next/image";
import ProductBorder from "@/public/assets/product-border-bg.png";
import { useRouter }from "next/navigation";

type PropType = {
  slides: any;
  options?: EmblaOptionsType
}

const EmblaCarousel: React.FC<PropType> = (props) => {
  const router = useRouter();
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options)

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi)

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)
  return (
    <section className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          
          <div
            className="products__available__slider__item"
          >
            <div className="item-top">
                {/* <img
                    // src={Audemar}
                    src={`https://artisan-solana.s3.eu-central-1.amazonaws.com/${item.accountPubkey}-0.jpg`}
                    alt="product"
                    className="item-top-img"
                /> */}
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '1rem'
            }}>
                  {/* this is the "category" card that displays what category follows, in this case watches */}
              <h2
                style={{
                  color: 'white',
                  fontSize: '7rem',
                }}
              >
                {slides && slides[0].objectType.watch ? 'Watches' : 'Diamonds'}
              </h2>
              {slides && slides.length > 0 && (
                <ul>
                  {/* collection length = slides.length */}
                  <li
                    style={{
                      color: 'white',
                      fontSize: '2rem',
                    }}
                  >
                    Product Count: {slides.length}
                  </li>
                  <li
                    style={{
                      color: 'white',
                      fontSize: '2rem',
                    }}
                  >
                    {/* total the price */}
                    Total Value: {slides.reduce((acc: number, item: any) => acc + Number(item.price), 0)}
                  </li>
                </ul>
              )}
            </div>
        </div>
          {slides && slides.length > 0 && 
            (slides?.map((item: any, index: number) => (
                <div
                    key={index}
                    className="products__available__slider__item"
                >
                    <Image
                        src={ProductBorder}
                        alt="product border"
                        className="products__available__slider__item__bg"
                    />
                    <div className="item-top">
                        <img
                            // src={Audemar}
                            src={`https://artisan-solana.s3.eu-central-1.amazonaws.com/${item.accountPubkey}-0.jpg`}
                            alt="product"
                            className="item-top-img"
                        />
                    </div>
                    <div className="item-body">
                        <h3 className="heading-6">
                            {item.watch[0].value ? item.watch[0].value : null +" "+ item.watch[1].value ? item.watch[1].value : null} <br/>
                            {item.description}
                        </h3>

                        <div className="item-body-details">
                            <div className="item-body-details-set">
                                <p className="label-5">
                                    FRACTIONS LEFT
                                </p>
                                <p className="label-3">
                                    {item.share - item.shareSold}
                                </p>
                            </div>

                            <div className="item-body-details-set">
                                <p className="label-5">
                                    STARTING FROM
                                </p>
                                <p className="label-3">
                                    {Number(item.price)}
                                </p>
                            </div>

                            <div className="item-body-details-set">
                                <p className="label-5">
                                    EARNING POTENTIAL
                                </p>
                                <p className="label-3 green">
                                    TBD
                                </p>
                            </div>
                        </div>

                        <button 
                            className="collect-btn"
                            onClick={() => {
                                router.push(`/product/${item.accountPubkey.toString()}`)
                                // router.push(`/product/1`);
                            }}
                        >
                            <p className="text">COLLECT NOW</p>
                        </button>
                    </div>
                </div>
          )))}
        </div>
      </div>

      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <div className="embla__dots">
          {scrollSnaps.map((_: any, index: any) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={'embla__dot'.concat(
                index === selectedIndex ? ' embla__dot--selected' : ''
              )}
              style={{
                color: 'green'
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default EmblaCarousel
